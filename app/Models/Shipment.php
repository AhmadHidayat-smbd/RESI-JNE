<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Shipment extends Model
{
    protected $fillable = [
        'pod_url',
        'awb',
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
    ];

    protected $casts = [
        'tgl_jam_entry' => 'datetime:Y-m-d H:i:s',
        'tgl_received'  => 'date:Y-m-d',
        'weight'        => 'decimal:2',
        'amount'        => 'decimal:2',
        'is_success'    => 'integer',
        'is_failed'     => 'integer',
        'is_on_delivery'=> 'integer',
        'is_on_process' => 'integer',
    ];

    /**
     * Pastikan format tanggal saat serialisasi JSON sama persis dengan format di database,
     * tanpa timezone offset (Z) agar frontend menampilkan jam & tanggal yang sama persis.
     */
    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────

    public function scopeSuccess(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->where('status', 'Success')
              ->orWhere('is_success', 1)
              ->orWhereIn('status', ['Sukses', 'sukses', 'Berhasil', 'berhasil', 'Delivered', 'delivered', 'Diterima', 'diterima', 'Terkirim', 'terkirim', 'POD', 'pod']);
        });
    }

    public function scopeFailed(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->where(function ($sub) {
                $sub->where('status', 'Failed')
                    ->orWhere('is_failed', 1)
                    ->orWhereIn('status', ['Gagal', 'gagal', 'Retur', 'retur']);
            })->where('status', '!=', 'Success')
              ->where('is_success', '!=', 1);
        });
    }

    public function scopeOnDelivery(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->where(function ($sub) {
                $sub->where('status', 'On Delivery')
                    ->orWhere('is_on_delivery', 1);
            })->where('status', '!=', 'Success')
              ->where('is_success', '!=', 1);
        });
    }

    public function scopeOnProcess(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->where(function ($sub) {
                $sub->where('status', 'On Process')
                    ->orWhere('is_on_process', 1);
            })->where('status', '!=', 'Success')
              ->where('is_success', '!=', 1);
        });
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Statistik ringkasan untuk dashboard.
     */
    public static function summary(): array
    {
        $total      = static::count();
        $success    = static::success()->count();
        $failed     = static::failed()->count();
        $onDelivery = static::onDelivery()->count();
        $onProcess  = static::onProcess()->count();

        return compact('total', 'success', 'failed', 'onDelivery', 'onProcess');
    }

    /**
     * Tren harian (7 hari terakhir berdasarkan tgl_jam_entry).
     */
    public static function dailyTrend(int $days = 14): array
    {
        $rows = static::selectRaw('DATE(tgl_jam_entry) as day, COUNT(*) as total')
            ->whereNotNull('tgl_jam_entry')
            ->groupByRaw('DATE(tgl_jam_entry)')
            ->orderByRaw('DATE(tgl_jam_entry) DESC')
            ->limit($days)
            ->get()
            ->reverse()
            ->values();

        return $rows->map(fn ($r) => [
            'day'   => $r->day,
            'total' => (int) $r->total,
        ])->toArray();
    }

    /**
     * Distribusi status.
     */
    public static function statusDistribution(): array
    {
        $rows = static::selectRaw('status, COUNT(*) as total')
            ->whereNotNull('status')
            ->groupBy('status')
            ->get();

        return $rows->map(fn ($r) => [
            'status' => $r->status,
            'total'  => $r->total,
        ])->toArray();
    }

    /**
     * Top 5 destinasi terbanyak.
     */
    public static function topDestinations(int $limit = 5): array
    {
        $rows = static::selectRaw('destination_name, COUNT(*) as total')
            ->whereNotNull('destination_name')
            ->groupBy('destination_name')
            ->orderByDesc('total')
            ->limit($limit)
            ->get();

        return $rows->map(fn ($r) => [
            'destination' => $r->destination_name,
            'total'       => $r->total,
        ])->toArray();
    }
}
