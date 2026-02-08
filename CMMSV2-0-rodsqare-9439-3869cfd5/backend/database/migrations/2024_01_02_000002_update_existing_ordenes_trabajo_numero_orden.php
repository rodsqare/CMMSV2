<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\OrdenTrabajo;

return new class extends Migration
{
    public function up(): void
    {
        // Update existing records to have numero_orden
        $ordenes = OrdenTrabajo::whereNull('numero_orden')->get();
        
        foreach ($ordenes as $index => $orden) {
            $year = date('Y');
            $numero = sprintf('OT-%s-%03d', $year, $index + 1);
            $orden->update(['numero_orden' => $numero]);
        }
    }

    public function down(): void
    {
        // No need to revert
    }
};
