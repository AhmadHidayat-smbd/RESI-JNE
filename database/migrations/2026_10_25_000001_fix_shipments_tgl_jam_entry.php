<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Perbaiki data yang sempat terbalik format tanggal dan bulannya saat import (2026-11-10 -> 2026-10-11)
        // Menjaga jam, menit, dan detik tetap sama persis
        DB::statement("
            UPDATE shipments
            SET tgl_jam_entry = CONCAT('2026-10-11 ', TIME(tgl_jam_entry))
            WHERE DATE(tgl_jam_entry) = '2026-11-10'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("
            UPDATE shipments
            SET tgl_jam_entry = CONCAT('2026-11-10 ', TIME(tgl_jam_entry))
            WHERE DATE(tgl_jam_entry) = '2026-10-11'
        ");
    }
};
