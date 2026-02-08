<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MantenimientoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_mantenimiento,
            'id_equipo' => $this->id_equipo,
            'equipo' => $this->whenLoaded('equipo', function() {
                return $this->equipo->nombre_equipo ?? null;
            }),
            'tipo' => $this->tipo,
            'frecuencia' => $this->frecuencia,
            'proxima_fecha' => $this->proxima_fecha,
            'ultima_fecha' => $this->ultima_fecha,
            'resultado' => $this->resultado,
            'observaciones' => $this->observaciones,
            'responsable_id' => $this->responsable_id,
            'responsable' => $this->whenLoaded('responsable', function() {
                return [
                    'id' => $this->responsable->id,
                    'nombre' => $this->responsable->nombre,
                ];
            }),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
