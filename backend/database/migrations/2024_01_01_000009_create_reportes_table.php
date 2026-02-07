<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reportes', function (Blueprint $table) {
            $table->id();
            $table->string('tipo_reporte');
            $table->foreignId('generado_por_id')->nullable()->constrained('usuarios')->onDelete('set null');
            $table->json('parametros')->nullable();
            $table->text('url_archivo')->nullable();
            $table->timestamps();
            
            $table->index('generado_por_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reportes');
    }
};
