<?php

namespace App\Http\Controllers;

use App\Imports\DestinationImport;
use App\Models\Destination;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\IOFactory;

class DestinationController extends Controller
{
    /**
     * Daftar destinasi dengan pencarian dan paginasi.
     */
    public function index(Request $request)
    {
        $query = Destination::query();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('syscode', 'like', "%{$s}%")
                  ->orWhere('code', 'like', "%{$s}%")
                  ->orWhere('kabupaten', 'like', "%{$s}%")
                  ->orWhere('kecamatan', 'like', "%{$s}%")
                  ->orWhere('regional', 'like', "%{$s}%")
                  ->orWhere('branch', 'like', "%{$s}%");
            });
        }

        $destinations = $query
            ->orderBy('syscode')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Destination/Index', [
            'destinations' => $destinations,
            'filters'      => $request->only(['search']),
        ]);
    }

    /**
     * Simpan data destinasi baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'syscode'       => ['required', 'string', 'max:20', 'unique:destinations,syscode'],
            'code'          => ['required', 'string', 'max:10'],
            'regional'      => ['nullable', 'string', 'max:100'],
            'kabupaten'     => ['required', 'string', 'max:100'],
            'kecamatan'     => ['nullable', 'string', 'max:100'],
            'branch'        => ['nullable', 'string', 'max:150'],
            'zone_delivery' => ['nullable', 'string', 'max:5'],
            'sla_days'      => ['nullable', 'integer', 'min:1', 'max:365'],
        ]);

        Destination::create($validated);

        return back()->with('success', 'Data daerah berhasil ditambahkan.');
    }

    /**
     * Update data destinasi.
     */
    public function update(Request $request, Destination $destination)
    {
        $validated = $request->validate([
            'syscode'       => ['required', 'string', 'max:20', "unique:destinations,syscode,{$destination->id}"],
            'code'          => ['required', 'string', 'max:10'],
            'regional'      => ['nullable', 'string', 'max:100'],
            'kabupaten'     => ['required', 'string', 'max:100'],
            'kecamatan'     => ['nullable', 'string', 'max:100'],
            'branch'        => ['nullable', 'string', 'max:150'],
            'zone_delivery' => ['nullable', 'string', 'max:5'],
            'sla_days'      => ['nullable', 'integer', 'min:1', 'max:365'],
        ]);

        $destination->update($validated);

        return back()->with('success', 'Data daerah berhasil diperbarui.');
    }

    /**
     * Hapus data destinasi.
     */
    public function destroy(Destination $destination)
    {
        $destination->delete();

        return back()->with('success', 'Data daerah berhasil dihapus.');
    }

    // ─── Import File Excel / CSV ─────────────────────────────────────────────

    /** Import the uploaded file and stream progress events to the browser. */
    public function import(Request $request)
    {
        set_time_limit(0);
        ini_set('max_execution_time', '0');
        ini_set('memory_limit', '1024M');

        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,xlsx,xls,txt', 'max:51200'],
        ], [
            'file.required' => 'File harus diunggah.',
            'file.mimes'    => 'Format file harus CSV (.csv) atau Excel (.xlsx/.xls).',
            'file.max'      => 'Ukuran file maksimal 50MB.',
        ]);

        $file = $request->file('file');
        $totalRows = $this->countRows($file);
        return response()->stream(function () use ($file, $totalRows): void {
            $sendProgress = static function (array $progress): void {
                echo json_encode($progress, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE) . "\n";

                while (ob_get_level() > 0) {
                    @ob_end_flush();
                }

                flush();
            };

            $sendProgress([
                'total' => $totalRows,
                'processed' => 0,
                'created' => 0,
                'updated' => 0,
                'status' => 'processing',
            ]);

            try {
                $import = new DestinationImport($totalRows, $sendProgress);
                Excel::import($import, $file);

                $sendProgress([
                    'total' => $totalRows,
                    'processed' => $totalRows,
                    'created' => $import->getCreatedCount(),
                    'updated' => $import->getUpdatedCount(),
                    'status' => 'done',
                ]);
            } catch (\Throwable $exception) {
                $sendProgress([
                    'total' => $totalRows,
                    'processed' => 0,
                    'created' => 0,
                    'updated' => 0,
                    'status' => 'error',
                    'error' => 'Gagal mengimpor file: ' . $exception->getMessage(),
                ]);
            }
        }, 200, [
            'Content-Type' => 'application/x-ndjson; charset=UTF-8',
            'Cache-Control' => 'no-cache, no-transform',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    /**
     * Hitung total baris data (tanpa header) secara efisien.
     */
    private function countRows($file): int
    {
        $path      = $file->getRealPath();
        $extension = strtolower($file->getClientOriginalExtension());

        if (in_array($extension, ['csv', 'txt'])) {
            // CSV: hitung baris secara efisien tanpa load seluruh file ke memory
            $count  = 0;
            $handle = fopen($path, 'r');
            if ($handle) {
                while (fgets($handle) !== false) {
                    $count++;
                }
                fclose($handle);
            }

            return max(0, $count - 1); // kurangi 1 untuk header
        }

        // Excel: gunakan listWorksheetInfo (ringan, tidak load data)
        try {
            $reader = IOFactory::createReaderForFile($path);
            $info   = $reader->listWorksheetInfo($path);

            return max(0, ($info[0]['totalRows'] ?? 1) - 1);
        } catch (\Throwable $e) {
            return 0;
        }
    }
}
