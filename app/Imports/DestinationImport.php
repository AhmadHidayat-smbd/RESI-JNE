<?php

namespace App\Imports;

use App\Models\Destination;
use Closure;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class DestinationImport implements ToCollection, WithHeadingRow, WithChunkReading
{
    private const BRANCH_HEADINGS = ['branch', 'cabang'];

    private const SLA_HEADINGS = ['sla_jne', 'sla_jne_hari', 'sla', 'sla_hari', 'sla_delivery'];

    private const ZONE_HEADINGS = [
        'zone_delivery',
        'zone_code',
        'zona_delevery_qce',
        'zona_delevery',
        'zona_delivery_qce',
        'zona_delivery',
        'zona_dh_every_ppjd',
        'zona_dh_every',
        'zona_tarif_ppdd',
        'zone',
        'zona',
    ];

    private int $totalRows;
    private int $processedRows = 0;
    private int $createdCount = 0;
    private int $updatedCount = 0;
    private Closure $onProgress;

    public function __construct(int $totalRows, Closure $onProgress)
    {
        $this->totalRows = $totalRows;
        $this->onProgress = $onProgress;
    }

    public function collection(Collection $rows): void
    {
        $data = [];
        $firstRow = $rows->first();
        $hasBranchColumn = $firstRow !== null && $this->hasAnyHeading($firstRow, self::BRANCH_HEADINGS);
        $hasZoneColumn = $firstRow !== null && $this->hasAnyHeading($firstRow, self::ZONE_HEADINGS);
        $hasSlaColumn = $firstRow !== null && $this->hasAnyHeading($firstRow, self::SLA_HEADINGS);

        foreach ($rows as $row) {
            $syscode = trim($row['syscode'] ?? $row['sys_code'] ?? '');
            if ($syscode === '') {
                continue;
            }

            $code = trim($row['code'] ?? $row['kode'] ?? $row['3lc'] ?? '');
            if ($code === '' && strlen($syscode) >= 3) {
                $code = strtoupper(substr($syscode, 0, 3));
            }

            $data[] = [
                'syscode'       => $syscode,
                'code'          => $code,
                'regional'      => $this->trimOrNull($row['regional'] ?? $row['region'] ?? null),
                'kabupaten'     => trim($row['kabupaten'] ?? $row['kabupaten_kota'] ?? $row['kota'] ?? ''),
                'kecamatan'     => $this->trimOrNull($row['kecamatan'] ?? null),
                'branch'        => $this->trimOrNull($row['branch'] ?? $row['cabang'] ?? null),
                'zone_delivery' => $this->resolveZone($row),
                'sla_days'      => $this->resolveSlaDays($row),
                'updated_at'    => now(),
                'created_at'    => now(),
            ];
        }

        if (empty($data)) {
            $this->processedRows += $rows->count();
            $this->updateProgress();
            return;
        }

        // Tentukan mana yang baru vs yang sudah ada
        $syscodes = array_column($data, 'syscode');
        $existing = Destination::whereIn('syscode', $syscodes)->pluck('syscode')->toArray();

        $newCount    = count(array_filter($data, fn ($r) => !in_array($r['syscode'], $existing)));
        $updateCount = count($data) - $newCount;

        // Bulk upsert — insert baru, update yang sudah ada
        $updateColumns = ['code', 'regional', 'kabupaten', 'kecamatan', 'updated_at'];

        if ($hasBranchColumn) {
            $updateColumns[] = 'branch';
        }

        if ($hasZoneColumn) {
            $updateColumns[] = 'zone_delivery';
        }

        if ($hasSlaColumn) {
            $updateColumns[] = 'sla_days';
        }

        Destination::upsert($data, ['syscode'], $updateColumns);

        $this->createdCount  += $newCount;
        $this->updatedCount  += $updateCount;
        $this->processedRows += $rows->count();
        $this->updateProgress();
    }

    /**
     * Cari kolom zone dari berbagai kemungkinan nama heading.
     */
    private function resolveZone($row): ?string
    {
        foreach (self::ZONE_HEADINGS as $key) {
            $val = trim($row[$key] ?? '');
            if ($val !== '') {
                return $val;
            }
        }

        return null;
    }

    private function resolveSlaDays($row): ?int
    {
        foreach (self::SLA_HEADINGS as $heading) {
            $value = trim((string) ($row[$heading] ?? ''));
            if ($value === '') {
                continue;
            }

            if (!is_numeric($value) || (float) $value !== (float) (int) $value) {
                throw new \UnexpectedValueException('Kolom SLA JNE harus berisi bilangan bulat antara 1 hingga 365.');
            }

            $days = (int) $value;
            if ($days < 1 || $days > 365) {
                throw new \UnexpectedValueException('Nilai SLA JNE harus berada antara 1 hingga 365 hari.');
            }

            return $days;
        }

        return null;
    }

    private function hasAnyHeading($row, array $headings): bool
    {
        foreach ($headings as $heading) {
            if (is_array($row) && array_key_exists($heading, $row)) {
                return true;
            }

            if ($row instanceof Collection && $row->has($heading)) {
                return true;
            }

            if ($row instanceof \ArrayAccess && $row->offsetExists($heading)) {
                return true;
            }
        }

        return false;
    }

    private function trimOrNull(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed !== '' ? $trimmed : null;
    }

    private function updateProgress(): void
    {
        $total = $this->totalRows > 0 ? $this->totalRows : $this->processedRows;

        ($this->onProgress)([
            'total'     => $total,
            'processed' => $this->totalRows > 0 ? min($this->processedRows, $this->totalRows) : $this->processedRows,
            'created'   => $this->createdCount,
            'updated'   => $this->updatedCount,
            'status'    => 'processing',
        ]);
    }

    public function chunkSize(): int
    {
        return 500;
    }

    public function getCreatedCount(): int
    {
        return $this->createdCount;
    }

    public function getUpdatedCount(): int
    {
        return $this->updatedCount;
    }
}

