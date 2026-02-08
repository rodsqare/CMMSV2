<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgramarMantenimiento extends Model
{
    protected $table = 'programar_mantenimiento';
    protected $primaryKey = 'id_mantenimiento';
    protected $fillable = ['id_equipo', 'tipo', 'frecuencia', 'proxima_fecha', 'ultima_fecha', 'resultado', 'observaciones', 'responsable_id'];
    protected $casts = [
        'proxima_fecha' => 'date',
        'ultima_fecha' => 'date',
    ];

    public function equipo()
    {
        return $this->belongsTo(Equipo::class, 'id_equipo');
    }

    public function responsable()
    {
        return $this->belongsTo(Usuario::class, 'responsable_id');
    }
}
