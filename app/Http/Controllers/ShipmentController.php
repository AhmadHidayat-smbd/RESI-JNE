<?php

namespace App\Http\Controllers;

use App\Exports\ShipmentExport;
use App\Imports\ShipmentImport;
use App\Models\Shipment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ShipmentController extends Controller
{
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

        $shipments = $query
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Resi/Index', [
            'shipments' => $shipments,
            'filters'   => $request->only(['status', 'search', 'date_from', 'date_to', 'destination']),
            'summary'   => Shipment::summary(),
        ]);
    }

    // ─── Export Excel dengan Filter Aktif ────────────────────────────────────

    public function export(Request $request)
    {
        $query = $this->buildFilteredQuery($request);

        $status   = $request->status;
        $dateFrom = $request->date_from;
        $dateTo   = $request->date_to;

        // Susun nama file yang jelas dan rapi
        $parts = ['Data_Resi'];
        if (!empty($status)) {
            $parts[] = str_replace(' ', '_', $status);
        }
        if (!empty($dateFrom) && !empty($dateTo)) {
            $parts[] = "{$dateFrom}_sd_{$dateTo}";
        } elseif (!empty($dateFrom)) {
            $parts[] = "dari_{$dateFrom}";
        } elseif (!empty($dateTo)) {
            $parts[] = "sampai_{$dateTo}";
        }
        $parts[] = now()->format('Ymd_His');

        $fileName = implode('_', $parts) . '.xlsx';

        return Excel::download(new ShipmentExport($query, $status), $fileName);
    }

    // ─── Helper Query Filter (Digunakan Index & Export) ──────────────────────

    private function buildFilteredQuery(Request $request): Builder
    {
        $query = Shipment::query();

        // Filter status menggunakan scope model yang fleksibel
        if ($request->filled('status')) {
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

        return $query->orderByDesc('tgl_jam_entry');
    }

    // ─── Halaman Detail Resi ─────────────────────────────────────────────────

    public function show(Shipment $shipment)
    {
        return Inertia::render('Resi/Show', [
            'shipment' => $shipment,
        ]);
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
        // Berikan waktu eksekusi tanpa batas dan memori yang cukup untuk dataset besar 
        set_time_limit(0);
        ini_set('max_execution_time', '0');
        ini_set('memory_limit', '1024M');

        $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:csv,xlsx,xls,txt',
                'max:102400', // 100MB
            ],
        ], [
            'file.required' => 'File harus diunggah.',
            'file.mimes'    => 'Format file harus CSV (.csv) atau Excel (.xlsx/.xls).',
            'file.max'      => 'Ukuran file maksimal 100MB.',
        ]);

        $file         = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $batchName    = pathinfo($originalName, PATHINFO_FILENAME) . '_' . now()->format('Ymd_His');

        // Deteksi delimiter otomatis jika file adalah CSV / Text
        $extension = strtolower($file->getClientOriginalExtension());
        $delimiter = ';'; // default delimiter untuk CSV JNE
        if (in_array($extension, ['csv', 'txt'])) {
            $path = $file->getRealPath();
            $handle = @fopen($path, 'r');
            if ($handle) {
                $sampleText = '';
                for ($i = 0; $i < 5 && !feof($handle); $i++) {
                    $sampleText .= fgets($handle);
                }
                fclose($handle);

                $semicolons = substr_count($sampleText, ';');
                $commas     = substr_count($sampleText, ',');
                $tabs       = substr_count($sampleText, "\t");

                if ($commas > $semicolons && $commas > $tabs) {
                    $delimiter = ',';
                } elseif ($tabs > $semicolons && $tabs > $commas) {
                    $delimiter = "\t";
                } else {
                    $delimiter = ';';
                }
            }
        }

        try {
            $import = new ShipmentImport($batchName, $delimiter);
            Excel::import($import, $file);

            $created = $import->getCreatedCount();
            $updated = $import->getUpdatedCount();

            // Verifikasi jumlah data yang benar-benar tersimpan di database untuk batch ini
            $batchTotal = Shipment::where('import_batch', $batchName)->count();
            if ($created === 0 && $updated === 0 && $batchTotal > 0) {
                $created = $batchTotal;
            }

            if ($created === 0 && $updated === 0 && $batchTotal === 0) {
                $errorMsg = 'Tidak ada data yang berhasil diimpor. Pastikan file memiliki baris data dan kolom nomor resi (AWB / No Resi / CNote).';
                return back()->withErrors(['file' => $errorMsg])->with(['error' => $errorMsg]);
            }

            $details = [];
            if ($created > 0) $details[] = "<strong>{$created}</strong> resi baru ditambahkan";
            if ($updated > 0) $details[] = "<strong>{$updated}</strong> resi diperbarui (status/data terupdate)";

            $summaryText = !empty($details) ? implode(' dan ', $details) : "Semua data berhasil diproses";

            return back()->with([
                'success'       => true,
                'message'       => "Import berhasil! {$summaryText}.",
                'batch'         => $batchName,
                'created_count' => $created,
                'updated_count' => $updated,
                'total_count'   => $batchTotal,
            ]);

        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            $failures = collect($e->failures())->take(5)->map(fn ($f) =>
                "Baris {$f->row()}: " . implode(', ', $f->errors())
            )->join(' | ');

            $errorMsg = 'Validasi data gagal: ' . $failures;
            return back()->withErrors(['file' => $errorMsg])->with(['error' => $errorMsg]);

        } catch (\Throwable $e) {
            $errorMsg = 'Gagal mengimpor file: ' . $e->getMessage();
            return back()->withErrors(['file' => $errorMsg])->with(['error' => $errorMsg]);
        }
    }

    // ─── Delete Batch ────────────────────────────────────────────────────────

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
