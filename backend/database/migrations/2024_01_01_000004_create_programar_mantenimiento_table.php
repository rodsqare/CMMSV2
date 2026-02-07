<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('programar_mantenimiento', function (Blueprint $table) {
            $table->id('id_mantenimiento');
            $table->foreignId('id_equipo')->constrained('equipos', 'id_equipo')->onDelete('cascade');
            $table->enum('tipo', ['calibracion', 'inspeccion', 'limpieza']);
            $table->enum('frecuencia', ['mensual', 'trimestral', 'semestral', 'anual']);
            $table->date('proxima_fecha');
            $table->date('ultima_fecha')->nullable();
            $table->enum('resultado', ['completado', 'pendiente', 'vencido'])->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamps();
            
            $table->index('id_equipo');
            $table->index('proxima_fecha');
            $table->index('resultado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('programar_mantenimiento');
    }
};
