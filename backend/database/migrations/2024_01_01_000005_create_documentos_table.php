<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documentos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('equipo_id');
            $table->foreign('equipo_id')->references('id_equipo')->on('equipos')->onDelete('cascade');
            $table->string('nombre_archivo');
            $table->string('tipo_archivo')->nullable();
            $table->integer('tamano_kb')->nullable();
            $table->text('url_archivo')->nullable();
            $table->foreignId('subido_por_id')->nullable()->constrained('usuarios')->onDelete('set null');
            $table->timestamps();
            
            $table->index('equipo_id');
            $table->index('subido_por_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documentos');
    }
};
