<?php

namespace App\Imports;

use App\Models\Shipment;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithCustomCsvSettings;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class ShipmentImport implements
    ToCollection,
    WithHeadingRow,
    WithCustomCsvSettings,
    SkipsEmptyRows,
    WithChunkReading
{
    private string $importBatch;
    private string $delimiter;
    private int    $importedCount = 0;
    private int    $createdCount  = 0;
    private int    $updatedCount  = 0;
    private int    $skippedCount  = 0;

    public function __construct(string $importBatch, string $delimiter = ';')
    {
        $this->importBatch = $importBatch;
        $this->delimiter   = $delimiter;
    }

    // ─── Pengaturan CSV ──────────────────────────────────────────────────────

    public function getCsvSettings(): array
    {
        return [
            'delimiter'        => $this->delimiter,
            'enclosure'        => '"',
            'escape_character' => '\\',
            'input_encoding'   => 'UTF-8',
        ];
    }

    public function chunkSize(): int
    {
        return 500;
    }

    // ─── Proses Data ─────────────────────────────────────────────────────────

    public function collection(Collection $rows): void
    {
        $upsertData = [];
        $now = now()->toDateTimeString();

        foreach ($rows as $row) {
            $row = $row->toArray();

            // 1. Ambil nomor resi / AWB dari berbagai kemungkinan nama kolom
            $rawAwb = $this->getValue($row, [
                'awb', 'Awb', 'AWB', 'no_resi', 'No Resi', 'noresi', 'resi', 'Resi',
                'cnote', 'CNote', 'CNOTE', 'no_cnote', 'No CNote', 'airwaybill', 'Airwaybill',
                'connote', 'Connote', 'b', 1,
            ]);

            if ($rawAwb === null || $rawAwb === '') {
                $this->skippedCount++;
                continue;
            }

            $awb = trim((string) $rawAwb);

            // Jika dalam notasi ilmiah (scientific notation dari Excel, misal 2.63E+12)
            if (stripos($awb, 'e+') !== false && is_numeric($awb)) {
                $awb = sprintf('%.0f', (float) $awb);
            }

            // Bersihkan format pecahan/desimal seperti ",00" atau ".00"
            $awb = preg_replace('/[,.]0+$/', '', $awb);
            if (str_ends_with($awb, ',')) {
                $awb = rtrim($awb, ',');
            }

            if (empty($awb)) {
                $this->skippedCount++;
                continue;
            }

            // 2. Cek kolom indikator status numerik/boolean (1/0)
            $rawSuccess  = trim((string) $this->getValue($row, ['success', 'Success', 'sukses', 'Sukses', 'berhasil', 'Berhasil']));
            $rawFailed   = trim((string) $this->getValue($row, ['failed', 'Failed', 'gagal', 'Gagal']));
            $rawDelivery = trim((string) $this->getValue($row, ['on_delivery', 'On Delivery', 'ondelivery', 'delivery', 'Delivery']));
            $rawProcess  = trim((string) $this->getValue($row, ['on_process', 'On Process', 'onprocess', 'process', 'Process', 'proces', 'proses']));

            // 3. Ambil teks dari kolom Status
            $statusRaw = trim((string) $this->getValue($row, ['status', 'Status', 'STATUS', 'p', 15]));

            // 4. Ambil teks dari kolom Receiver Reason
            $receiverReason = trim((string) $this->getValue($row, [
                'receiver_reason', 'Receiver Reason', 'receiverreason', 'receiver_r', 'Receiver R',
                'alasan', 'keterangan_status', 'r', 17,
            ]));

            // Fallback keterangan jika receiver_reason kosong
            $keterangan = trim((string) $this->getValue($row, ['keterangan', 'Keterangan', 'keteranga', 'c', 2]));
            if (empty($receiverReason) && !empty($keterangan)) {
                $stripped = trim(strip_tags($keterangan));
                if (!empty($stripped)) {
                    $receiverReason = $stripped;
                }
            }

            // 5. Resolusi status standar yang akurat
            $status = $this->resolveStatus($statusRaw, $rawSuccess, $rawFailed, $rawDelivery, $rawProcess, $receiverReason);

            $isSuccess    = ($status === 'Success') ? 1 : 0;
            $isFailed     = ($status === 'Failed') ? 1 : 0;
            $isOnDelivery = ($status === 'On Delivery') ? 1 : 0;
            $isOnProcess  = ($status === 'On Process') ? 1 : 0;

            $data = [
                'awb'              => $awb,
                'pod_url'          => $this->extractPodLink($this->getValue($row, ['pod', 'POD', 'pod_url', 'a', 0])),
                'tgl_jam_entry'    => $this->parseDate($this->getValue($row, [
                    'tgl_jam_entry', 'Tgl Jam Entry', 'tgljamentry', 'tgl_jam_en', 'Tgl Jam En', 'tgl_entry', 'entry_date', 'd', 3,
                ])),
                'consignee_name'   => $this->getValue($row, [
                    'consignee', 'Consignee', 'consignee_name', 'Consignee Name', 'consigneename', 'penerima', 'nama_penerima', 'e', 4,
                ]),
                'adr1'             => $this->getValue($row, ['adr1', 'Adr1', 'ADR1', 'alamat1', 'address1', 'f', 5]),
                'adr2'             => $this->getValue($row, ['adr2', 'Adr2', 'ADR2', 'alamat2', 'address2', 'g', 6]),
                'adr3'             => $this->getValue($row, ['adr3', 'Adr3', 'ADR3', 'alamat3', 'address3', 'h', 7]),
                'origin_code'      => $this->getValue($row, [
                    'origin_code', 'Origin Code', 'origincode', 'origin_cod', 'Origin Cod', 'origin', 'asal', 'i', 8,
                ]),
                'destination_code' => $this->getValue($row, [
                    'destination_code', 'Destination Code', 'destinationcode', 'destinatio', 'Destinatio', 'dest_code', 'j', 9,
                ]),
                'destination_name' => $this->getValue($row, [
                    'detination', 'Detination', 'detination_name', 'Detination Name', 'detinationname',
                    'destination', 'Destination', 'destination_name', 'Destination Name', 'destinationname',
                    'tujuan', 'kota_tujuan', 'k', 10,
                ]),
                'service'          => $this->getValue($row, ['service', 'Service', 'SERVICE', 'layanan', 'l', 11]),
                'weight'           => $this->parseNumeric($this->getValue($row, ['weight', 'Weight', 'WEIGHT', 'berat', 'm', 12])),
                'amount'           => $this->parseNumeric($this->getValue($row, ['amount', 'Amount', 'AMOUNT', 'biaya', 'ongkir', 'tarif', 'n', 13])),
                'coding'           => $this->getValue($row, ['coding', 'Coding', 'CODING', 'o', 14]),
                'status'           => $status,
                'tgl_received'     => $this->parseReceivedDate($this->getValue($row, [
                    'tgl_received', 'Tgl Received', 'tglreceived', 'tgl_receive', 'Tgl Receive', 'tgl_terima', 'q', 16,
                ])),
                'receiver_reason'  => $receiverReason ?: $this->getValue($row, ['receiver_reason', 'Receiver Reason', 'receiverreason']),
                'latlong'          => $this->getValue($row, ['latlong', 'Latlong', 'LATLONG', 'koordinat', 's', 18]),
                'pod_picture'      => $this->getValue($row, ['pod_picture', 'POD Picture', 'podpicture', 't', 19]),
                'pod_signature'    => $this->getValue($row, ['pod_signature', 'POD Signature', 'podsignature']),
                'foto_pod_1'       => $this->getValue($row, ['foto_pod_1', 'Foto POD 1']),
                'foto_pod_2'       => $this->getValue($row, ['foto_pod_2', 'Foto POD 2']),
                'foto_pod_3'       => $this->getValue($row, ['foto_pod_3', 'Foto POD 3']),
                'foto_pod_4'       => $this->getValue($row, ['foto_pod_4', 'Foto POD 4']),
                'foto_pod_5'       => $this->getValue($row, ['foto_pod_5', 'Foto POD 5']),
                'foto_pod_6'       => $this->getValue($row, ['foto_pod_6', 'Foto POD 6']),
                'foto_pod_7'       => $this->getValue($row, ['foto_pod_7', 'Foto POD 7']),
                'is_success'       => $isSuccess,
                'is_failed'        => $isFailed,
                'is_on_delivery'   => $isOnDelivery,
                'is_on_process'    => $isOnProcess,
                'runsheet_no'      => $this->getValue($row, ['runsheet_no', 'Runsheet No', 'runsheetno', 'runsheet']),
                'import_batch'     => $this->importBatch,
                'created_at'       => $now,
                'updated_at'       => $now,
            ];

            // Deduplikasi AWB dalam chunk yang sama
            $upsertData[$awb] = $data;
        }

        if (empty($upsertData)) {
            return;
        }

        // Cek AWB yang sudah ada di database untuk chunk ini dalam 1 query cepat
        $awbs = array_keys($upsertData);
        $existingShipments = Shipment::whereIn('awb', $awbs)
            ->pluck('tgl_jam_entry', 'awb')
            ->toArray();

        foreach ($upsertData as $awb => &$item) {
            if (array_key_exists($awb, $existingShipments)) {
                // Jangan kosongkan tgl_jam_entry jika di file bernilai null tapi di database sudah ada
                if (empty($item['tgl_jam_entry']) && !empty($existingShipments[$awb])) {
                    $item['tgl_jam_entry'] = $existingShipments[$awb];
                }
                $this->updatedCount++;
            } else {
                $this->createdCount++;
            }
        }
        unset($item);

        // Kolom yang akan diupdate jika AWB sudah pernah ada (ON DUPLICATE KEY UPDATE)
        $updateColumns = [
            'pod_url',
            'tgl_jam_entry',
            'consignee_name',
            'adr1',
            'adr2',
            'adr3',
            'origin_code',
            'destination_code',
            'destination_name',
            'service',
            'weight',
            'amount',
            'coding',
            'status',
            'tgl_received',
            'receiver_reason',
            'latlong',
            'pod_picture',
            'pod_signature',
            'foto_pod_1',
            'foto_pod_2',
            'foto_pod_3',
            'foto_pod_4',
            'foto_pod_5',
            'foto_pod_6',
            'foto_pod_7',
            'is_success',
            'is_failed',
            'is_on_delivery',
            'is_on_process',
            'runsheet_no',
            'import_batch',
            'updated_at',
        ];

        // Eksekusi Bulk Upsert sekaligus dalam 1 query cepat ke MySQL
        Shipment::upsert(array_values($upsertData), ['awb'], $updateColumns);

        $this->importedCount += count($upsertData);
    }

    // ─── Helper Methods ──────────────────────────────────────────────────────

    /**
     * Ambil nilai dari array row dengan berbagai kemungkinan penulisan key
     * (sangat toleran huruf besar/kecil, spasi, underscore, strip, serta index numerik).
     */
    private function getValue(array $row, array $keys): ?string
    {
        // 1. Coba exact match & lowercase match langsung
        foreach ($keys as $key) {
            if (isset($row[$key]) && $row[$key] !== null && $row[$key] !== '') {
                return trim((string) $row[$key]);
            }
            if (is_string($key)) {
                $lowerKey = strtolower(str_replace([' ', '-', '.'], '_', trim($key)));
                if (isset($row[$lowerKey]) && $row[$lowerKey] !== null && $row[$lowerKey] !== '') {
                    return trim((string) $row[$lowerKey]);
                }
            }
        }

        // 2. Normalisasi semua keys dari $row (hapus whitespace & non-alfanumerik)
        $normalizedRow = [];
        foreach ($row as $k => $v) {
            if (is_string($k)) {
                $cleanK = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $k));
                if ($cleanK !== '') {
                    $normalizedRow[$cleanK] = $v;
                }
            }
        }

        foreach ($keys as $key) {
            if (is_string($key)) {
                $cleanSearch = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $key));
                if (isset($normalizedRow[$cleanSearch]) && $normalizedRow[$cleanSearch] !== null && $normalizedRow[$cleanSearch] !== '') {
                    return trim((string) $normalizedRow[$cleanSearch]);
                }
            }
        }

        return null;
    }

    /**
     * Resolusi status ke 4 status standar: Success, Failed, On Delivery, On Process.
     * Memeriksa baik kolom indikator (1/0) maupun teks kolom Status & Receiver Reason.
     */
    private function resolveStatus(
        ?string $statusRaw,
        string $rawSuccess,
        string $rawFailed,
        string $rawDelivery,
        string $rawProcess,
        ?string $receiverReason = null
    ): string {
        $isTrue = fn ($v) => in_array(strtolower(trim((string)$v)), ['1', 'true', 'yes', 'y', 'ya', 'success', 'sukses'], true);

        $lower       = strtolower(trim((string) $statusRaw));
        $reasonLower = strtolower(trim((string) $receiverReason));

        // ─── PRIORITAS 1: Teks Kolom Status Eksplisit ────────────────────────
        // Jika kolom Status diisi secara eksplisit oleh pengguna, gunakan nilai tersebut

        // A. Eksplisit Success
        if (
            str_contains($lower, 'success') ||
            str_contains($lower, 'sukses') ||
            str_contains($lower, 'berhasil') ||
            str_contains($lower, 'delivered') ||
            str_contains($lower, 'diterima') ||
            str_contains($lower, 'terkirim') ||
            str_contains($lower, 'selesai') ||
            str_contains($lower, 'complete') ||
            $lower === 'pod'
        ) {
            return 'Success';
        }

        // B. Eksplisit On Process (termasuk variasi salah ketik seperti on proces/proses)
        if (
            str_contains($lower, 'on process') ||
            str_contains($lower, 'on-process') ||
            str_contains($lower, 'onprocess') ||
            str_contains($lower, 'on proces') ||
            str_contains($lower, 'on-proces') ||
            str_contains($lower, 'onproces') ||
            str_contains($lower, 'on proses') ||
            str_contains($lower, 'process') ||
            str_contains($lower, 'proces') ||
            str_contains($lower, 'proses') ||
            str_contains($lower, 'transit') ||
            str_contains($lower, 'manifest') ||
            str_contains($lower, 'sorting') ||
            str_contains($lower, 'hub') ||
            str_contains($lower, 'gateway')
        ) {
            return 'On Process';
        }

        // C. Eksplisit On Delivery
        if (
            str_contains($lower, 'on delivery') ||
            str_contains($lower, 'on-delivery') ||
            str_contains($lower, 'ondelivery') ||
            str_contains($lower, 'sedang diantar') ||
            str_contains($lower, 'pengantaran') ||
            str_contains($lower, 'kurir') ||
            str_contains($lower, 'with courier') ||
            str_contains($lower, 'out for delivery') ||
            $lower === 'delivery'
        ) {
            return 'On Delivery';
        }

        // D. Eksplisit Failed
        if (
            str_contains($lower, 'failed') ||
            str_contains($lower, 'gagal') ||
            str_contains($lower, 'retur') ||
            str_contains($lower, 'return') ||
            str_contains($lower, 'cancel') ||
            str_contains($lower, 'batal') ||
            str_contains($lower, 'reject') ||
            str_contains($lower, 'undelivered')
        ) {
            return 'Failed';
        }

        // ─── PRIORITAS 2: Indikator Kolom Boolean & Receiver Reason ──────────
        // Jika teks kolom Status kosong / tidak eksplisit, cek indikator dan alasan penerima

        // 1. Success
        if (
            $isTrue($rawSuccess) ||
            str_contains($reasonLower, 'diterima') ||
            str_contains($reasonLower, 'sukses') ||
            str_contains($reasonLower, 'keluarga serumah') ||
            str_contains($reasonLower, 'ybs')
        ) {
            return 'Success';
        }

        // 2. On Process
        if ($isTrue($rawProcess)) {
            return 'On Process';
        }

        // 3. On Delivery
        if ($isTrue($rawDelivery)) {
            return 'On Delivery';
        }

        // 4. Failed
        if (
            $isTrue($rawFailed) ||
            str_contains($reasonLower, 'antar ulang') ||
            str_contains($reasonLower, 'terjadwal ulang')
        ) {
            return 'Failed';
        }

        return !empty($statusRaw) ? ucfirst($statusRaw) : 'On Process';
    }

    /**
     * Parse tanggal jam entry (format standar Indonesia/JNE: d/m/Y H:i, misal: "11/10/2026 18:33",
     * serta format serial number date dari Excel).
     */
    private function parseDate(mixed $raw): ?Carbon
    {
        if (empty($raw)) return null;

        // Tangani jika cell Excel berupa angka serial date (misal 46306.77291)
        if (is_numeric($raw) && (float)$raw > 1000 && (float)$raw < 100000) {
            try {
                return Carbon::instance(\PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject((float)$raw));
            } catch (\Exception) {}
        }

        if ($raw instanceof \DateTimeInterface) {
            return Carbon::instance($raw);
        }

        $raw = trim((string) $raw);
        if (str_contains($raw, '<')) {
            $raw = trim(strip_tags($raw));
        }

        // Prioritaskan format Indonesia d/m/Y H:i agar hari dan bulan tidak terbalik
        $formats = [
            'd/m/Y H:i:s',
            'd/m/Y H:i',
            'd-m-Y H:i:s',
            'd-m-Y H:i',
            'Y-m-d H:i:s',
            'Y-m-d H:i',
            'm/d/Y H:i:s',
            'm/d/Y H:i',
        ];

        foreach ($formats as $fmt) {
            try {
                return Carbon::createFromFormat($fmt, $raw);
            } catch (\Exception) {
                continue;
            }
        }

        try {
            return Carbon::parse($raw);
        } catch (\Exception) {
            return null;
        }
    }

    /**
     * Parse tanggal received (format: d-M-y, misal: 19-Oct-26, serta serial date Excel).
     */
    private function parseReceivedDate(mixed $raw): ?Carbon
    {
        if (empty($raw)) return null;

        // Tangani jika cell Excel berupa angka serial date
        if (is_numeric($raw) && (float)$raw > 1000 && (float)$raw < 100000) {
            try {
                return Carbon::instance(\PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject((float)$raw));
            } catch (\Exception) {}
        }

        if ($raw instanceof \DateTimeInterface) {
            return Carbon::instance($raw);
        }

        $raw = trim((string) $raw);
        if (str_contains($raw, '<')) {
            $raw = trim(strip_tags($raw));
        }

        $formats = [
            'd-M-y',
            'd-M-Y',
            'd/m/Y',
            'd-m-Y',
            'Y-m-d',
            'd-m-Y H:i:s',
            'd/m/Y H:i:s',
        ];

        foreach ($formats as $fmt) {
            try {
                return Carbon::createFromFormat($fmt, $raw);
            } catch (\Exception) {
                continue;
            }
        }

        try {
            return Carbon::parse($raw);
        } catch (\Exception) {
            return null;
        }
    }

    /**
     * Bersihkan nilai numerik (hapus titik ribuan, ganti koma desimal).
     */
    private function parseNumeric(?string $raw): ?float
    {
        if (empty($raw)) return null;

        // Hapus karakter non-numerik kecuali koma dan titik
        $clean = preg_replace('/[^\d,.]/', '', $raw);
        // Jika ada koma sebagai pemisah ribuan (1.154.000 atau 1,154,000)
        $clean = str_replace(',', '', $clean);
        return is_numeric($clean) ? (float) $clean : null;
    }

    /**
     * Ekstrak URL POD dari string yang mungkin berisi HTML/path.
     * Contoh: "/apex/WS_HYBRID.SHOW_POD?p_cnote=..."
     */
    private function extractPodLink(?string $raw): ?string
    {
        if (empty($raw)) return null;
        return trim($raw);
    }

    public function getImportedCount(): int
    {
        return $this->importedCount;
    }

    public function getCreatedCount(): int
    {
        return $this->createdCount;
    }

    public function getUpdatedCount(): int
    {
        return $this->updatedCount;
    }

    public function getSkippedCount(): int
    {
        return $this->skippedCount;
    }
}
