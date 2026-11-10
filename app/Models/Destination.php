<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Destination extends Model
{
    protected $fillable = [
        'syscode',
        'code',
        'regional',
        'kabupaten',
        'kecamatan',
        'branch',
        'zone_delivery',
        'sla_days',
    ];

    protected $casts = [
        'sla_days' => 'integer',
    ];

    /**
     * Relasi: satu destination memiliki banyak shipment (via destination_code → syscode).
     */
    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class, 'destination_code', 'syscode');
    }
}

