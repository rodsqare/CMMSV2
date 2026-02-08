<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MantenimientoPreventivo extends Model
{
    protected $table = 'mantenimiento_preventivo';
    protected $fillable = ['equipo_id', 'tipo', 'frecuencia', 'proxima_fecha', 'ultima_fecha', 'resultado', 'observaciones'];
    protected $casts = [
        'proxima_fecha' => 'date',
        'ultima_fecha' => 'date',
    ];

    public function equipo()
    {
        return $this->belongsTo(Equipo::class);
    }
}
