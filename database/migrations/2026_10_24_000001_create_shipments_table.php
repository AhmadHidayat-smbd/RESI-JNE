<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();

            // Identifikasi
            $table->string('pod_url')->nullable();           // URL link ke detail POD
            $table->string('awb')->nullable()->index();      // Nomor AWB/Resi (kolom "Awb")
            $table->datetime('tgl_jam_entry')->nullable();   // Tanggal & jam entry

            // Penerima
            $table->string('consignee_name')->nullable();    // Nama penerima
            $table->text('adr1')->nullable();                // Alamat 1
            $table->text('adr2')->nullable();                // Alamat 2
            $table->text('adr3')->nullable();                // Alamat 3

            // Pengiriman
            $table->string('origin_code', 20)->nullable();       // Kode asal (misal: CKR10000)
            $table->string('destination_code', 20)->nullable();  // Kode tujuan (misal: BDJ10400)
            $table->string('destination_name')->nullable();      // Nama tujuan (misal: TANJUNG,KAB.TABALONG)
            $table->string('service', 20)->nullable();           // Layanan (misal: TRC11)
            $table->decimal('weight', 8, 2)->nullable();         // Berat
            $table->decimal('amount', 15, 2)->nullable();        // Nilai/harga
            $table->string('coding', 20)->nullable();            // Coding layanan (misal: CR5, U05, U01)

            // Status utama
            $table->string('status', 30)->nullable()->index();   // Success / Failed / On Delivery / On Process
            $table->date('tgl_received')->nullable();            // Tanggal diterima
            $table->string('receiver_reason')->nullable();       // Alasan penerima/keterangan

            // Koordinat
            $table->string('latlong')->nullable();               // Koordinat GPS

            // Foto & dokumen
            $table->text('pod_picture')->nullable();             // Foto POD utama
            $table->text('pod_signature')->nullable();           // Tanda tangan POD
            $table->text('foto_pod_1')->nullable();
            $table->text('foto_pod_2')->nullable();
            $table->text('foto_pod_3')->nullable();
            $table->text('foto_pod_4')->nullable();
            $table->text('foto_pod_5')->nullable();
            $table->text('foto_pod_6')->nullable();
            $table->text('foto_pod_7')->nullable();

            // Flag status (0 atau 1)
            $table->tinyInteger('is_success')->default(0);
            $table->tinyInteger('is_failed')->default(0);
            $table->tinyInteger('is_on_delivery')->default(0);
            $table->tinyInteger('is_on_process')->default(0);

            // Runsheet
            $table->string('runsheet_no')->nullable()->index();  // Nomor runsheet

            // Metadata import
            $table->string('import_batch')->nullable()->index(); // Batch import (nama file)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};
