<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UsuarioSeeder::class,
            EquipoSeeder::class,
            OrdenTrabajoSeeder::class,
            MantenimientoPreventivoSeeder::class,
            DocumentoSeeder::class,
            HistorialTareaSeeder::class,
            LogAuditoriaSeeder::class,
            NotificacionSeeder::class,
        ]);
    }
}
