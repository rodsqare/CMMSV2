<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usuarios', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('correo')->unique();
            $table->string('contrasena');
            $table->enum('rol', ['administrador', 'supervisor', 'tecnico']);
            $table->string('especialidad')->nullable();
            $table->enum('estado', ['activo', 'inactivo'])->default('activo');
            $table->json('permisos')->default('{}');
            $table->timestamps();
            
            $table->index('correo');
            $table->index('rol');
            $table->index('estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usuarios');
    }
};
