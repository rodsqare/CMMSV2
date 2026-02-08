<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify the enum to include 'cancelada'
        DB::statement("ALTER TABLE ordenes_trabajo MODIFY COLUMN estado ENUM('abierta', 'en_progreso', 'completada', 'pospuesta', 'cancelada') DEFAULT 'abierta'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum (warning: data with 'cancelada' might be truncated or cause errors)
        // We generally don't want to lose data in down(), but strictly speaking we should revert structure.
        // For safety in this specific context, we'll keep 'cancelada' or map it back if we were strict, 
        // but here we simply allow the migration to be reversible in structure definition if possible.
        // However, standard SQL doesn't easily allow dropping an enum value if data exists.
        // We will skip reverting the enum modification to avoid data loss.
    }
};
