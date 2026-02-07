<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrdenTrabajo extends Model
{
    protected $table = 'ordenes_trabajo';
    protected $primaryKey = 'id_orden';
    
    protected $fillable = [
        'numero_orden',
        'id_equipo',
        'tipo',
        'prioridad',
        'estado',
        'descripcion',
        'tecnico_asignado_id',
        'fecha_creacion',
        'fecha_inicio',
        'fecha_finalizacion',
        'horas_trabajadas',
        'costo_repuestos',
        'costo_total',
        'observaciones',
        'notas'
    ];
    
    protected $casts = [
        'fecha_creacion' => 'date',
        'fecha_inicio' => 'date',
        'fecha_finalizacion' => 'date',
        'horas_trabajadas' => 'decimal:2',
        'costo_repuestos' => 'decimal:2',
        'costo_total' => 'decimal:2',
    ];

    public function equipo()
    {
        return $this->belongsTo(Equipo::class, 'id_equipo');
    }

    public function tecnicoAsignado()
    {
        return $this->belongsTo(Usuario::class, 'tecnico_asignado_id');
    }
}
