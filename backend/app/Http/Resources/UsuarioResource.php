<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'correo' => $this->correo,
            'rol' => $this->rol,
            'especialidad' => $this->especialidad,
            'estado' => ucfirst(strtolower($this->estado ?? 'activo')),
            'permisos' => is_string($this->permisos) ? json_decode($this->permisos, true) : $this->permisos,
            'fecha_creacion' => $this->created_at?->format('Y-m-d H:i:s'),
            'ultima_actualizacion' => $this->updated_at?->format('Y-m-d H:i:s'),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
