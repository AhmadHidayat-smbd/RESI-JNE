<?php

namespace App\Http\Controllers;

use App\Models\Shipment;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $summary          = Shipment::summary();
        $dailyTrend       = Shipment::dailyTrend(14);
        $statusDist       = Shipment::statusDistribution();
        $topDestinations  = Shipment::topDestinations(5);
        $recentShipments  = Shipment::orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'awb', 'consignee_name', 'destination_name', 'tgl_received', 'status', 'service']);

        // ─── Data tambahan untuk dashboard profesional ──────────────────

        // Distribusi layanan (REG, YES, OKE, dll)
        $serviceDist = Shipment::selectRaw('service, COUNT(*) as total')
            ->whereNotNull('service')
            ->where('service', '!=', '')
            ->groupBy('service')
            ->orderByDesc('total')
            ->limit(8)
            ->get()
            ->map(fn ($r) => ['service' => $r->service, 'total' => $r->total])
            ->toArray();

        // Top 5 destinasi gagal
        $topFailedDest = Shipment::selectRaw('destination_name, COUNT(*) as total')
            ->where('status', 'Failed')
            ->whereNotNull('destination_name')
            ->groupBy('destination_name')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($r) => ['destination' => $r->destination_name, 'total' => $r->total])
            ->toArray();

        // Tren status harian (per-status breakdown)
        $dailyStatusTrend = Shipment::selectRaw("
                DATE(tgl_jam_entry) as day,
                SUM(CASE WHEN status = 'Success' THEN 1 ELSE 0 END) as success,
                SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = 'On Delivery' THEN 1 ELSE 0 END) as on_delivery,
                SUM(CASE WHEN status = 'On Process' THEN 1 ELSE 0 END) as on_process,
                COUNT(*) as total
            ")
            ->whereNotNull('tgl_jam_entry')
            ->groupByRaw('DATE(tgl_jam_entry)')
            ->orderByRaw('DATE(tgl_jam_entry) DESC')
            ->limit(14)
            ->get()
            ->reverse()
            ->values()
            ->map(fn ($r) => [
                'day'         => $r->day,
                'success'     => (int) $r->success,
                'failed'      => (int) $r->failed,
                'on_delivery' => (int) $r->on_delivery,
                'on_process'  => (int) $r->on_process,
                'total'       => (int) $r->total,
            ])
            ->toArray();

        // Statistik berat & nilai
        $weightAmountStats = [
            'totalWeight' => round(Shipment::sum('weight') ?? 0, 1),
            'totalAmount' => round(Shipment::sum('amount') ?? 0, 0),
            'avgWeight'   => round(Shipment::avg('weight') ?? 0, 2),
        ];

        // Info batch terakhir
        $lastBatch = Shipment::selectRaw('import_batch, COUNT(*) as total, MAX(created_at) as imported_at')
            ->whereNotNull('import_batch')
            ->groupBy('import_batch')
            ->orderByDesc('imported_at')
            ->first();

        $lastBatchInfo = $lastBatch ? [
            'name'       => $lastBatch->import_batch,
            'total'      => $lastBatch->total,
            'importedAt' => $lastBatch->imported_at,
        ] : null;

        return Inertia::render('Dashboard', compact(
            'summary',
            'dailyTrend',
            'statusDist',
            'topDestinations',
            'recentShipments',
            'serviceDist',
            'topFailedDest',
            'dailyStatusTrend',
            'weightAmountStats',
            'lastBatchInfo',
        ));
    }
}

