<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ordenes_trabajo', function (Blueprint $table) {
            $table->id('id_orden');
            $table->foreignId('id_equipo')->constrained('equipos', 'id_equipo')->onDelete('cascade');
            $table->text('descripcion');
            $table->enum('prioridad', ['baja', 'media', 'critica']);
            $table->enum('estado', ['abierta', 'en_progreso', 'completada', 'pospuesta'])->default('abierta');
            $table->foreignId('tecnico_asignado_id')->nullable()->constrained('usuarios')->onDelete('set null');
            $table->timestamp('fecha_completado')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();
            
            $table->index('id_equipo');
            $table->index('tecnico_asignado_id');
            $table->index('estado');
            $table->index('prioridad');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ordenes_trabajo');
    }
};
