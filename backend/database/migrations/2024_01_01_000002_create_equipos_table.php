<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipos', function (Blueprint $table) {
            $table->id('id_equipo');
            
            // Información básica del equipo
            $table->string('nombre_equipo');
            $table->string('fabricante')->nullable();
            $table->string('modelo')->nullable();
            $table->string('numero_serie')->unique()->nullable();
            $table->string('codigo_institucional')->unique()->nullable();
            
            // Ubicación y servicio
            $table->string('ubicacion')->nullable();
            $table->string('servicio')->nullable();
            
            // Fechas importantes
            $table->date('fecha_instalacion')->nullable();
            $table->date('fecha_ingreso')->nullable();
            $table->date('vencimiento_garantia')->nullable();
            $table->date('ultima_calibracion')->nullable();
            $table->date('ultima_inspeccion')->nullable();
            $table->date('fecha_retiro')->nullable();
            
            // Procedencia y proveedor
            $table->string('procedencia')->nullable();
            $table->string('proveedor_nombre')->nullable();
            $table->string('proveedor_direccion')->nullable();
            $table->string('proveedor_telefono')->nullable();
            
            // Especificaciones técnicas
            $table->string('voltaje')->nullable();
            $table->string('corriente')->nullable();
            $table->string('potencia')->nullable();
            $table->string('frecuencia')->nullable();
            $table->text('otros_especificaciones')->nullable();
            
            // Accesorios y consumibles
            $table->text('accesorios_consumibles')->nullable();
            
            // Estado y clasificación
            $table->enum('estado', ['operativo', 'en_reparacion', 'fuera_de_servicio', 'nuevo'])->default('operativo');
            $table->enum('estado_equipo', ['nuevo', 'operativo', 'no_operable'])->default('operativo');
            $table->boolean('es_critico')->default(false);
            
            // Manuales disponibles
            $table->boolean('manual_usuario')->default(false);
            $table->boolean('manual_servicio')->default(false);
            
            // Nivel de riesgo
            $table->enum('nivel_riesgo', ['alto', 'medio', 'bajo'])->default('medio');
            
            // Observaciones
            $table->text('observaciones')->nullable();
            
            // Foto del equipo
            $table->string('foto_url')->nullable();
            
            $table->timestamps();
            
            // Índices para mejorar consultas
            $table->index('numero_serie');
            $table->index('codigo_institucional');
            $table->index('estado');
            $table->index('ubicacion');
            $table->index('servicio');
            $table->index('es_critico');
            $table->index('nivel_riesgo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipos');
    }
};
