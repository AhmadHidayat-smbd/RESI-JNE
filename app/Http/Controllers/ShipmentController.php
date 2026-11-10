<?php

namespace App\Http\Controllers;

use App\Exports\ShipmentExport;
use App\Imports\ShipmentImport;
use App\Models\Destination;
use App\Models\Shipment;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Imports\HeadingRowFormatter;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ShipmentController extends Controller
{
    private const IMPORT_CHUNK_SIZE = 500;
    private const IMPORT_STATE_TTL = 86400;

    // ─── Halaman Monitoring Resi ─────────────────────────────────────────────

    public function index(Request $request)
    {
        // Auto-sinkronisasi data berstatus Success yang sebelumnya tersimpan tidak konsisten
        Shipment::where('is_success', 1)
            ->where('status', '!=', 'Success')
            ->update([
                'status'         => 'Success',
                'is_failed'      => 0,
                'is_on_delivery' => 0,
                'is_on_process'  => 0,
            ]);

        Shipment::where('status', '!=', 'Success')
            ->where(function ($q) {
                $q->whereIn('status', ['Sukses', 'sukses', 'Berhasil', 'berhasil', 'Delivered', 'delivered', 'Diterima', 'diterima', 'Terkirim', 'terkirim', 'POD', 'pod'])
                  ->orWhere('receiver_reason', 'like', '%diterima%')
                  ->orWhere('receiver_reason', 'like', '%sukses%');
            })
            ->update([
                'status'         => 'Success',
                'is_success'     => 1,
                'is_failed'      => 0,
                'is_on_delivery' => 0,
                'is_on_process'  => 0,
            ]);

        $query = $this->buildFilteredQuery($request);
        $summaryQuery = $this->buildFilteredQuery(
            $request,
            includeStatusFilter: false,
            includeActionFilter: false,
        );

        $shipments = $query
            ->with('destination:id,syscode,kabupaten,kecamatan')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Resi/Index', [
            'shipments' => $shipments,
            'filters'   => $request->only([
                'status',
                'search',
                'date_from',
                'date_to',
                'destination',
                'three_lc',
                'kabupaten',
                'action',
            ]),
            'destinationOptions' => Destination::query()
                ->select('code', 'kabupaten')
                ->whereNotNull('code')
                ->where('code', '!=', '')
                ->whereNotNull('kabupaten')
                ->where('kabupaten', '!=', '')
                ->distinct()
                ->orderBy('code')
                ->orderBy('kabupaten')
                ->get(),
            'summary'   => $this->summarizeFilteredQuery($summaryQuery),
        ]);
    }

    // ─── Export Excel dengan Filter Aktif ────────────────────────────────────

    public function export(Request $request)
    {
        // Berikan waktu eksekusi dan alokasi memori yang cukup agar export seluruh data tidak out-of-memory
        set_time_limit(0);
        ini_set('max_execution_time', '0');
        ini_set('memory_limit', '2048M');

        $isAll = $request->boolean('all') || $request->get('scope') === 'all';

        if ($isAll) {
            $query       = Shipment::query()->orderByDesc('tgl_jam_entry');
            $titleStatus = 'Semua';
            $fileName    = 'Data_Semua_Resi_' . now()->format('Ymd_His') . '.xlsx';
        } else {
            $query = $this->buildFilteredQuery($request);

            $status   = $request->status;
            $action   = $request->action;
            $threeLc  = $request->three_lc;
            $kabupaten = $request->kabupaten;
            $dateFrom = $request->date_from;
            $dateTo   = $request->date_to;

            // Susun nama file yang jelas dan rapi
            $parts = ['Data_Resi'];
            if (!empty($status)) {
                $parts[] = str_replace(' ', '_', $status);
            }
            if (!empty($action)) {
                $parts[] = 'Aksi_' . ucfirst($action);
            }
            if (!empty($threeLc)) {
                $parts[] = '3LC_' . $threeLc;
            }
            if (!empty($kabupaten)) {
                $parts[] = str_replace(' ', '_', $kabupaten);
            }
            if (!empty($dateFrom) && !empty($dateTo)) {
                $parts[] = "{$dateFrom}_sd_{$dateTo}";
            } elseif (!empty($dateFrom)) {
                $parts[] = "dari_{$dateFrom}";
            } elseif (!empty($dateTo)) {
                $parts[] = "sampai_{$dateTo}";
            }
            $parts[] = now()->format('Ymd_His');

            $fileName    = implode('_', $parts) . '.xlsx';
            $titleStatus = $status ?: ($action ? "Aksi " . ucfirst($action) : 'Semua');
        }

        return Excel::download(new ShipmentExport($query, $titleStatus), $fileName);
    }

    // ─── Helper Query Filter (Digunakan Index & Export) ──────────────────────

    private function buildFilteredQuery(
        Request $request,
        bool $includeStatusFilter = true,
        bool $includeActionFilter = true,
    ): Builder
    {
        $query = Shipment::query();

        // Filter status menggunakan scope model yang fleksibel
        if ($includeStatusFilter && $request->filled('status')) {
            $status = $request->status;
            if ($status === 'Success') {
                $query->success();
            } elseif ($status === 'Failed') {
                $query->failed();
            } elseif ($status === 'On Delivery') {
                $query->onDelivery();
            } elseif ($status === 'On Process') {
                $query->onProcess();
            } else {
                $query->where('status', $status);
            }
        }

        // Filter tanggal (tgl_jam_entry atau tgl_received)
        if ($request->filled('date_from')) {
            $query->where(function ($q) use ($request) {
                $q->whereDate('tgl_jam_entry', '>=', $request->date_from)
                  ->orWhereDate('tgl_received', '>=', $request->date_from);
            });
        }
        if ($request->filled('date_to')) {
            $query->where(function ($q) use ($request) {
                $q->whereDate('tgl_jam_entry', '<=', $request->date_to)
                  ->orWhereDate('tgl_received', '<=', $request->date_to);
            });
        }

        // Filter destinasi
        if ($request->filled('destination')) {
            $query->where('destination_name', 'like', '%' . $request->destination . '%');
        }

        // Filter 3LC dan kabupaten melalui data master tujuan.
        if ($request->filled('three_lc') || $request->filled('kabupaten')) {
            $query->whereHas('destination', function (Builder $destinationQuery) use ($request) {
                if ($request->filled('three_lc')) {
                    $destinationQuery->where('code', $request->input('three_lc'));
                }

                if ($request->filled('kabupaten')) {
                    $destinationQuery->where('kabupaten', $request->input('kabupaten'));
                }
            });
        }

        // Search AWB / Consignee / Runsheet
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('awb', 'like', "%$s%")
                  ->orWhere('consignee_name', 'like', "%$s%")
                  ->orWhere('runsheet_no', 'like', "%$s%")
                  ->orWhere('destination_name', 'like', "%$s%");
            });
        }

        // Filter aksi (hold / cancel)
        if ($includeActionFilter && $request->filled('action')) {
            $query->where('action', $request->action);
        }

        return $query->orderByDesc('tgl_jam_entry');
    }

    private function summarizeFilteredQuery(Builder $query): array
    {
        return [
            'total' => (clone $query)->count(),
            'success' => (clone $query)->success()->count(),
            'failed' => (clone $query)->failed()->count(),
            'onDelivery' => (clone $query)->onDelivery()->count(),
            'onProcess' => (clone $query)->onProcess()->count(),
            'hold' => (clone $query)->where('action', 'hold')->count(),
            'cancel' => (clone $query)->where('action', 'cancel')->count(),
        ];
    }

    // ─── Halaman Detail Resi ─────────────────────────────────────────────────

    public function show(Shipment $shipment)
    {
        $shipment->load('destination');

        return Inertia::render('Resi/Show', [
            'shipment' => $shipment,
            'slaEvaluation' => $this->evaluateDestinationSla($shipment),
        ]);
    }

    private function evaluateDestinationSla(Shipment $shipment): array
    {
        $status = mb_strtolower(trim((string) $shipment->status));
        $successfulStatuses = ['success', 'sukses', 'berhasil', 'delivered', 'diterima', 'terkirim', 'pod'];

        if (!$shipment->is_success && !in_array($status, $successfulStatuses, true)) {
            return ['state' => 'pending', 'message' => 'Evaluasi SLA tersedia setelah status resi Success.'];
        }

        $destination = $shipment->destination;
        if (!$destination || !$destination->sla_days) {
            return ['state' => 'unavailable', 'message' => 'SLA untuk destination ini belum diisi.'];
        }

        if (!$shipment->tgl_jam_entry || !$shipment->tgl_received) {
            return [
                'state' => 'unavailable',
                'sla_days' => $destination->sla_days,
                'message' => 'Tanggal entry atau tanggal diterima belum tersedia.',
            ];
        }

        $entryDate = Carbon::parse($shipment->tgl_jam_entry)->startOfDay();
        $receivedDate = Carbon::parse($shipment->tgl_received)->startOfDay();

        if ($receivedDate->lt($entryDate)) {
            return [
                'state' => 'unavailable',
                'sla_days' => $destination->sla_days,
                'message' => 'Tanggal diterima lebih awal daripada tanggal entry. Periksa data tanggal resi.',
            ];
        }

        // Hari entry dihitung sebagai hari pertama masa pengiriman. +1 jika di hitung hari itu
        $deliveryDays = (int) $entryDate->diffInDays($receivedDate);
        $difference = $deliveryDays - $destination->sla_days;

        return [
            'state' => $difference > 0 ? 'late' : ($difference < 0 ? 'early' : 'on_time'),
            'sla_days' => $destination->sla_days,
            'delivery_days' => $deliveryDays,
            'difference_days' => abs($difference),
        ];
    }

    // ─── Update Aksi Hold / Cancel (tidak mengubah status asli) ──────────────

    public function updateAction(Request $request, Shipment $shipment)
    {
        $request->validate([
            'action' => ['nullable', 'in:hold,cancel'],
            'note'   => ['nullable', 'string', 'max:500'],
        ]);

        $shipment->update([
            'action'      => $request->action,
            'action_note' => $request->action ? $request->note : null,
            'actioned_at' => $request->action ? now() : null,
        ]);

        return back()->with('success', $request->action
            ? 'Aksi ' . ucfirst($request->action) . ' berhasil disimpan.'
            : 'Aksi berhasil dihapus.'
        );
    }

    // ─── Import File ─────────────────────────────────────────────────────────

    public function importView()
    {
        $batches = Shipment::select('import_batch')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(is_success) as success')
            ->selectRaw('SUM(is_failed) as failed')
            ->selectRaw('SUM(is_on_delivery) as on_delivery')
            ->selectRaw('SUM(is_on_process) as on_process')
            ->selectRaw('MAX(created_at) as imported_at')
            ->whereNotNull('import_batch')
            ->groupBy('import_batch')
            ->orderByDesc('imported_at')
            ->limit(20)
            ->get();

        return Inertia::render('Resi/Import', [
            'batches' => $batches,
            'flash'   => [
                'success'       => session('success'),
                'message'       => session('message'),
                'error'         => session('error'),
                'batch'         => session('batch'),
                'created_count' => session('created_count'),
                'updated_count' => session('updated_count'),
                'total_count'   => session('total_count'),
            ],
        ]);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,xlsx,xls,txt', 'max:102400'],
        ], [
            'file.required' => 'File harus diunggah.',
            'file.mimes' => 'Format file harus CSV (.csv) atau Excel (.xlsx/.xls).',
            'file.max' => 'Ukuran file maksimal 100MB.',
        ]);

        $file = $request->file('file');
        $userId = (int) $request->user()->getAuthIdentifier();
        $token = (string) Str::uuid();
        $extension = strtolower($file->getClientOriginalExtension());
        $storedPath = null;

        try {
            $activeKey = $this->shipmentActiveImportKey($userId);
            $previousToken = Cache::get($activeKey);
            if ($previousToken) {
                $previousKey = $this->shipmentImportKey($previousToken);
                $previousState = Cache::get($previousKey);
                if ($previousState) {
                    Storage::disk('local')->delete($previousState['file_path']);
                    Cache::forget($previousKey);
                }
                Cache::forget($activeKey);
            }

            $storedPath = $file->storeAs('shipment-imports', $token . '.' . $extension, 'local');
            if (!$storedPath) {
                throw new \RuntimeException('File tidak dapat disimpan untuk diproses.');
            }

            $absolutePath = Storage::disk('local')->path($storedPath);
            $state = [
                'user_id' => $userId,
                'file_path' => $storedPath,
                'extension' => $extension,
                'batch' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME) . '_' . now()->format('Ymd_His'),
                'delimiter' => ';',
                'headers' => [],
                'cursor' => 0,
                'total' => 0,
                'processed' => 0,
                'created' => 0,
                'updated' => 0,
                'skipped' => 0,
                'status' => 'processing',
            ];

            if (in_array($extension, ['csv', 'txt'], true)) {
                $state['delimiter'] = $this->detectCsvDelimiter($absolutePath);
                [$state['total'], $state['headers'], $state['cursor']] = $this->inspectCsv(
                    $absolutePath,
                    $state['delimiter'],
                );
            } else {
                $reader = IOFactory::createReaderForFile($absolutePath);
                $worksheetInfo = $reader->listWorksheetInfo($absolutePath);
                $state['total'] = max(0, ($worksheetInfo[0]['totalRows'] ?? 1) - 1);
            }

            if ($state['total'] < 1) {
                Storage::disk('local')->delete($storedPath);

                return response()->json([
                    'success' => false,
                    'message' => 'File tidak memiliki baris data untuk diimpor.',
                ], 422);
            }

            Cache::put($this->shipmentImportKey($token), $state, self::IMPORT_STATE_TTL);
            Cache::put($activeKey, $token, self::IMPORT_STATE_TTL);

            return response()->json([
                'success' => true,
                'token' => $token,
                'batch' => $state['batch'],
                'progress' => $this->shipmentImportProgress($state),
            ]);
        } catch (\Throwable $exception) {
            if ($storedPath) {
                Storage::disk('local')->delete($storedPath);
            }

            return response()->json([
                'success' => false,
                'message' => 'File gagal disiapkan: ' . $exception->getMessage(),
            ], 422);
        }
    }

    public function importChunk(Request $request, string $token)
    {
        $key = $this->shipmentImportKey($token);
        $state = Cache::get($key);

        if (!$state || $state['user_id'] !== (int) $request->user()->getAuthIdentifier()) {
            return response()->json(['success' => false, 'message' => 'Sesi import tidak ditemukan atau sudah kedaluwarsa.'], 404);
        }

        if ($state['status'] === 'done') {
            return response()->json([
                'success' => true,
                'done' => true,
                'progress' => $this->shipmentImportProgress($state),
                'result' => $state['result'],
            ]);
        }

        if ($state['status'] !== 'processing') {
            return response()->json(['success' => false, 'message' => $state['error'] ?? 'Import tidak dapat dilanjutkan.'], 409);
        }

        try {
            $limit = min(self::IMPORT_CHUNK_SIZE, $state['total'] - $state['processed']);
            $absolutePath = Storage::disk('local')->path($state['file_path']);
            $import = new ShipmentImport(
                $state['batch'],
                $state['delimiter'],
                2 + $state['processed'],
                $limit,
            );

            if (in_array($state['extension'], ['csv', 'txt'], true)) {
                [$rows, $nextCursor] = $this->readCsvChunk($absolutePath, $state);
                $import->collection(new Collection($rows));
                $processedInChunk = count($rows);
                $state['cursor'] = $nextCursor;
            } else {
                Excel::import($import, $absolutePath);
                $processedInChunk = $limit;
                $state['cursor'] += $processedInChunk;
            }

            if ($processedInChunk === 0 && $limit > 0) {
                throw new \RuntimeException('File berakhir sebelum seluruh baris selesai diproses.');
            }

            $state['processed'] = min($state['total'], $state['processed'] + $processedInChunk);
            $state['created'] += $import->getCreatedCount();
            $state['updated'] += $import->getUpdatedCount();
            $state['skipped'] += $import->getSkippedCount();
            $isDone = $state['processed'] >= $state['total'];

            if ($isDone) {
                $totalImported = Shipment::where('import_batch', $state['batch'])->count();

                if ($totalImported === 0) {
                    throw new \RuntimeException('Tidak ada data yang berhasil diimpor. Pastikan file memiliki kolom nomor resi (AWB / No Resi / CNote).');
                }

                $state['status'] = 'done';
                $state['result'] = [
                    'batch' => $state['batch'],
                    'created_count' => $state['created'],
                    'updated_count' => $state['updated'],
                    'total_count' => $totalImported,
                    'skipped_count' => $state['skipped'],
                ];
                Storage::disk('local')->delete($state['file_path']);
                Cache::forget($this->shipmentActiveImportKey($state['user_id']));
            }

            Cache::put($key, $state, self::IMPORT_STATE_TTL);

            return response()->json([
                'success' => true,
                'done' => $isDone,
                'progress' => $this->shipmentImportProgress($state),
                'result' => $state['result'] ?? null,
            ]);
        } catch (\Throwable $exception) {
            $exceptionMessage = $exception->getMessage();
            if (preg_match('//u', $exceptionMessage) !== 1) {
                $exceptionMessage = 'File berisi teks dengan encoding yang tidak didukung.';
            }
            if (str_contains($exceptionMessage, 'Malformed UTF-8 characters')) {
                $exceptionMessage = 'File berisi teks yang perlu dikonversi ke UTF-8.';
            }

            Log::error('Shipment import chunk failed.', [
                'token' => $token,
                'exception' => get_class($exception),
                'message' => $exceptionMessage,
            ]);

            $state['status'] = 'error';
            $state['error'] = 'Gagal memproses import: ' . $exceptionMessage;
            Cache::put($key, $state, self::IMPORT_STATE_TTL);
            Cache::forget($this->shipmentActiveImportKey($state['user_id']));
            Storage::disk('local')->delete($state['file_path']);

            return response()->json([
                'success' => false,
                'message' => $state['error'],
                'progress' => $this->shipmentImportProgress($state),
            ], 422);
        }
    }

    public function cancelImport(Request $request, string $token)
    {
        $key = $this->shipmentImportKey($token);
        $state = Cache::get($key);

        if ($state && $state['user_id'] === (int) $request->user()->getAuthIdentifier()) {
            Storage::disk('local')->delete($state['file_path']);
            Cache::forget($key);
            Cache::forget($this->shipmentActiveImportKey($state['user_id']));
        }

        return response()->json(['success' => true]);
    }

    private function inspectCsv(string $path, string $delimiter): array
    {
        $handle = fopen($path, 'rb');
        if ($handle === false) {
            throw new \RuntimeException('File CSV tidak dapat dibaca.');
        }

        try {
            $rawHeaders = fgetcsv($handle, 0, $delimiter, '"', '\\');
            if ($rawHeaders === false) {
                return [0, [], 0];
            }

            $rawHeaders[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $rawHeaders[0]);
            $headers = HeadingRowFormatter::format($rawHeaders);
            $cursor = ftell($handle);
            $total = 0;

            while (fgetcsv($handle, 0, $delimiter, '"', '\\') !== false) {
                $total++;
            }

            return [$total, $headers, $cursor];
        } finally {
            fclose($handle);
        }
    }

    private function readCsvChunk(string $path, array $state): array
    {
        $handle = fopen($path, 'rb');
        if ($handle === false) {
            throw new \RuntimeException('File CSV tidak dapat dibaca.');
        }

        try {
            if (fseek($handle, (int) $state['cursor']) !== 0) {
                throw new \RuntimeException('Posisi pembacaan file CSV tidak valid.');
            }

            $rows = [];
            for ($index = 0; $index < self::IMPORT_CHUNK_SIZE && count($rows) < $state['total'] - $state['processed']; $index++) {
                $values = fgetcsv($handle, 0, $state['delimiter'], '"', '\\');
                if ($values === false) {
                    break;
                }

                $values = array_slice(array_pad($values, count($state['headers']), null), 0, count($state['headers']));
                $rows[] = new Collection(array_combine($state['headers'], $values));
            }

            return [$rows, ftell($handle)];
        } finally {
            fclose($handle);
        }
    }

    private function detectCsvDelimiter(string $path): string
    {
        $handle = fopen($path, 'rb');
        if ($handle === false) {
            throw new \RuntimeException('File CSV tidak dapat dibaca.');
        }

        $sample = '';
        for ($line = 0; $line < 5 && !feof($handle); $line++) {
            $sample .= fgets($handle) ?: '';
        }
        fclose($handle);

        $counts = [
            ';' => substr_count($sample, ';'),
            ',' => substr_count($sample, ','),
            "\t" => substr_count($sample, "\t"),
        ];
        arsort($counts);

        return array_key_first($counts) ?: ';';
    }

    private function shipmentImportKey(string $token): string
    {
        return 'shipment_import_' . $token;
    }

    private function shipmentActiveImportKey(int $userId): string
    {
        return 'shipment_import_active_' . $userId;
    }

    private function shipmentImportProgress(array $state): array
    {
        return [
            'total' => $state['total'],
            'processed' => $state['processed'],
            'created' => $state['created'],
            'updated' => $state['updated'],
            'status' => $state['status'],
        ];
    }
    public function deleteBatch(Request $request)
    {
        $request->validate(['batch' => 'required|string']);

        $deleted = Shipment::where('import_batch', $request->batch)->delete();

        return back()->with([
            'success' => true,
            'message' => "Batch berhasil dihapus ({$deleted} data).",
        ]);
    }

    // ─── Dashboard Data (API) ────────────────────────────────────────────────

    public function dashboardData()
    {
        return response()->json([
            'summary'          => Shipment::summary(),
            'dailyTrend'       => Shipment::dailyTrend(7),
            'statusDistribution' => Shipment::statusDistribution(),
            'topDestinations'  => Shipment::topDestinations(5),
            'recentShipments'  => Shipment::orderByDesc('created_at')
                ->limit(10)
                ->get(['id', 'awb', 'consignee_name', 'destination_name', 'tgl_received', 'status']),
        ]);
    }
}
