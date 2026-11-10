<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->enum('action', ['hold', 'cancel'])->nullable()->after('import_batch');
            $table->text('action_note')->nullable()->after('action');
            $table->timestamp('actioned_at')->nullable()->after('action_note');
        });
    }

    public function down(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->dropColumn(['action', 'action_note', 'actioned_at']);
        });
    }
};

