<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            // Drop regular index jika ada
            try {
                $table->dropIndex('shipments_awb_index');
            } catch (\Throwable $e) {
                // Ignore jika belum ada
            }

            // Tambahkan UNIQUE index pada awb untuk mendukung Bulk Upsert
            $table->unique('awb', 'shipments_awb_unique');
        });
    }

    public function down(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->dropUnique('shipments_awb_unique');
            $table->index('awb', 'shipments_awb_index');
        });
    }
};
