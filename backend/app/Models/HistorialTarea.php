<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistorialTarea extends Model
{
    protected $table = 'historial_tareas';
    protected $fillable = ['equipo_id', 'tipo_tarea', 'descripcion', 'fecha_tarea', 'resultado', 'realizado_por_id'];
    protected $casts = [
        'fecha_tarea' => 'date',
    ];

    public function equipo()
    {
        return $this->belongsTo(Equipo::class);
    }

    public function realizado_por()
    {
        return $this->belongsTo(Usuario::class, 'realizado_por_id');
    }
}
