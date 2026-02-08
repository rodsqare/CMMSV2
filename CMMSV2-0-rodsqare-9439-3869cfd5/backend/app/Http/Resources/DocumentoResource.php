<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'equipo_id' => $this->equipo_id,
            'equipoId' => $this->equipo_id,
            'nombre_archivo' => $this->nombre_archivo,
            'nombreArchivo' => $this->nombre_archivo,
            'nombre' => $this->nombre_archivo,
            'tipo_archivo' => $this->tipo_archivo,
            'tipoArchivo' => $this->tipo_archivo,
            'tamano_kb' => $this->tamano_kb,
            'tamanoKb' => $this->tamano_kb,
            'url_archivo' => $this->url_archivo ? asset('storage/' . $this->url_archivo) : null,
            'urlArchivo' => $this->url_archivo ? asset('storage/' . $this->url_archivo) : null,
            'subido_por_id' => $this->subido_por_id,
            'subidoPorId' => $this->subido_por_id,
            'subido_por' => $this->whenLoaded('subido_por', function () {
                return $this->subido_por?->nombre;
            }),
            'subidoPor' => $this->whenLoaded('subido_por', function () {
                return $this->subido_por?->nombre;
            }),
            'fecha_subida' => $this->created_at?->format('Y-m-d'),
            'fechaSubida' => $this->created_at?->format('Y-m-d'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
