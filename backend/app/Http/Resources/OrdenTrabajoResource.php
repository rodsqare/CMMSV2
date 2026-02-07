<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrdenTrabajoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_orden,
            'numeroOrden' => $this->numero_orden,
            'equipoId' => $this->id_equipo,
            'equipoNombre' => $this->equipo?->nombre_equipo ?? 'Sin equipo',
            'tipo' => $this->tipo,
            'prioridad' => $this->prioridad,
            'estado' => $this->estado,
            'descripcion' => $this->descripcion,
            'fechaCreacion' => $this->fecha_creacion ? $this->fecha_creacion->format('Y-m-d') : null,
            'fechaInicio' => $this->fecha_inicio ? $this->fecha_inicio->format('Y-m-d') : null,
            'fechaFinalizacion' => $this->fecha_finalizacion ? $this->fecha_finalizacion->format('Y-m-d') : null,
            'tecnicoAsignadoId' => $this->tecnico_asignado_id,
            'tecnicoAsignadoNombre' => $this->tecnicoAsignado?->nombre ?? null,
            'horasTrabajadas' => $this->horas_trabajadas,
            'costoRepuestos' => $this->costo_repuestos,
            'costoTotal' => $this->costo_total,
            'observaciones' => $this->observaciones,
        ];
    }
}
