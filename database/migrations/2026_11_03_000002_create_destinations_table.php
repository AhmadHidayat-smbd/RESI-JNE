<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('destinations', function (Blueprint $table) {
            $table->id();
            $table->string('syscode', 20)->unique();
            $table->string('code', 10)->comment('3LC — 3 karakter awal SYSCODE');
            $table->string('regional', 100)->nullable();
            $table->string('kabupaten', 100);
            $table->string('kecamatan', 100)->nullable();
            $table->string('branch', 150)->nullable();
            $table->string('zone_delivery', 5)->nullable()->comment('Zona pengiriman: A, B, C, dll');
            $table->timestamps();

            $table->index('code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('destinations');
    }
};

