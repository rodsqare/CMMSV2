<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordenes_trabajo', function (Blueprint $table) {
            // Add numero_orden field
            $table->string('numero_orden')->unique()->after('id_orden');
            
            // Add tipo field
            $table->enum('tipo', ['preventivo', 'correctivo', 'inspeccion'])->after('id_equipo');
            
            // Add fecha fields
            $table->date('fecha_creacion')->default(now())->after('tecnico_asignado_id');
            $table->date('fecha_inicio')->nullable()->after('fecha_creacion');
            $table->date('fecha_finalizacion')->nullable()->after('fecha_inicio');
            
            // Add cost and hours fields
            $table->decimal('horas_trabajadas', 8, 2)->nullable()->after('fecha_finalizacion');
            $table->decimal('costo_repuestos', 10, 2)->nullable()->after('horas_trabajadas');
            $table->decimal('costo_total', 10, 2)->nullable()->after('costo_repuestos');
            
            // Add observaciones field
            $table->text('observaciones')->nullable()->after('costo_total');
            
            // Remove fecha_completado as it's replaced by fecha_finalizacion
            $table->dropColumn('fecha_completado');
        });
    }

    public function down(): void
    {
        Schema::table('ordenes_trabajo', function (Blueprint $table) {
            $table->dropColumn([
                'numero_orden',
                'tipo',
                'fecha_creacion',
                'fecha_inicio',
                'fecha_finalizacion',
                'horas_trabajadas',
                'costo_repuestos',
                'costo_total',
                'observaciones'
            ]);
            
            $table->timestamp('fecha_completado')->nullable()->after('tecnico_asignado_id');
        });
    }
};
