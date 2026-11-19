<?php

namespace App\Exports;

use App\Models\Shipment;
use Carbon\Carbon;

class ShipmentSlaEvaluator
{
    public function evaluate(Shipment $shipment): array
    {
        $status = mb_strtolower(trim((string) $shipment->status));
        $successfulStatuses = [
            'success',
            'sukses',
            'berhasil',
            'delivered',
            'diterima',
            'terkirim',
            'pod',
        ];

        if (!$shipment->is_success && !in_array($status, $successfulStatuses, true)) {
            return [
                'state' => 'pending',
                'message' => 'Evaluasi SLA tersedia setelah status resi Success.',
                'summary' => 'Belum dapat dihitung (status belum Success).',
            ];
        }

        $destination = $shipment->destination;

        if (!$destination || !$destination->sla_days) {
            return [
                'state' => 'unavailable',
                'message' => 'SLA untuk destination ini belum diisi.',
                'summary' => 'Belum dapat dihitung (SLA destination belum tersedia).',
            ];
        }

        $slaDays = (int) $destination->sla_days;

        if (!$shipment->tgl_jam_entry || !$shipment->tgl_received) {
            $message = 'Tanggal entry atau tanggal diterima belum tersedia.';

            return [
                'state' => 'unavailable',
                'sla_days' => $slaDays,
                'message' => $message,
                'summary' => 'Belum dapat dihitung (tanggal pengiriman belum lengkap).',
            ];
        }

        $entryDate = Carbon::parse($shipment->tgl_jam_entry)->startOfDay();
        $receivedDate = Carbon::parse($shipment->tgl_received)->startOfDay();

        if ($receivedDate->lt($entryDate)) {
            $message = 'Tanggal diterima lebih awal daripada tanggal entry. Periksa data tanggal resi.';

            return [
                'state' => 'unavailable',
                'sla_days' => $slaDays,
                'message' => $message,
                'summary' => 'Belum dapat dihitung (tanggal perlu diperiksa).',
            ];
        }

        // Pertahankan rumus yang saat ini digunakan di detail resi.
        $deliveryDays = (int) $entryDate->diffInDays($receivedDate);
        $difference = $deliveryDays - $slaDays;

        return [
            'state' => $difference > 0
                ? 'late'
                : ($difference < 0 ? 'early' : 'on_time'),
            'sla_days' => $slaDays,
            'delivery_days' => $deliveryDays,
            'difference_days' => abs($difference),
            'summary' => $this->makeSummary($difference, $deliveryDays),
        ];
    }

    private function makeSummary(int $difference, int $deliveryDays): string
    {
        if ($difference > 0) {
            return sprintf(
                'Terlambat %d hari (%d hari)',
                $difference,
                $deliveryDays,
            );
        }

        if ($difference < 0) {
            return sprintf(
                'Lebih cepat %d hari (%d hari)',
                abs($difference),
                $deliveryDays,
            );
        }

        return sprintf('Tepat waktu (%d hari)', $deliveryDays);
    }
}