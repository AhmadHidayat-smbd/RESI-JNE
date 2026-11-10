<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Perbaiki data status yang tidak konsisten di database:
     * - is_success=1 tapi status != 'Success'  → set ke 'Success'
     * - status mengandung kata-kata keberhasilan → set ke 'Success'
     * - Normalisasi Failed / On Delivery / On Process dari flag
     */
    public function up(): void
    {
        // 1. is_success = 1 tapi status bukan 'Success'
        DB::statement("
            UPDATE shipments
            SET status = 'Success', is_failed = 0, is_on_delivery = 0, is_on_process = 0
            WHERE is_success = 1 AND status != 'Success'
        ");

        // 2. Status sinonim sukses yang belum dinormalisasi
        DB::statement("
            UPDATE shipments
            SET status = 'Success', is_success = 1, is_failed = 0, is_on_delivery = 0, is_on_process = 0
            WHERE status != 'Success'
              AND (
                  LOWER(status) IN ('sukses','berhasil','delivered','diterima','terkirim','selesai','pod','complete')
                  OR LOWER(receiver_reason) LIKE '%diterima oleh%'
                  OR LOWER(receiver_reason) LIKE '%sukses%'
              )
        ");

        // 3. is_failed = 1 tapi status bukan 'Failed', pastikan bukan success
        DB::statement("
            UPDATE shipments
            SET status = 'Failed', is_success = 0, is_on_delivery = 0, is_on_process = 0
            WHERE is_failed = 1 AND status != 'Failed' AND status != 'Success' AND is_success = 0
        ");

        // 4. is_on_delivery = 1 tapi status bukan 'On Delivery'
        DB::statement("
            UPDATE shipments
            SET status = 'On Delivery', is_success = 0, is_failed = 0, is_on_process = 0
            WHERE is_on_delivery = 1
              AND status != 'On Delivery'
              AND status != 'Success'
              AND status != 'Failed'
              AND is_success = 0
        ");

        // 5. is_on_process = 1 tapi status bukan 'On Process'
        DB::statement("
            UPDATE shipments
            SET status = 'On Process', is_success = 0, is_failed = 0, is_on_delivery = 0
            WHERE is_on_process = 1
              AND status != 'On Process'
              AND status != 'Success'
              AND status != 'Failed'
              AND status != 'On Delivery'
              AND is_success = 0
        ");
    }

    public function down(): void
    {
        // Tidak bisa di-rollback karena data status asli tidak disimpan
    }
};
