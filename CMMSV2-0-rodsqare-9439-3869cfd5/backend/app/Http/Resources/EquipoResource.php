<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EquipoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_equipo,
            
            // Información básica
            'nombre_equipo' => $this->nombre_equipo,
            'fabricante' => $this->fabricante,
            'modelo' => $this->modelo,
            'numero_serie' => $this->numero_serie,
            'numeroSerie' => $this->numero_serie,
            'codigoInstitucional' => $this->codigo_institucional,
            
            // Ubicación y servicio
            'ubicacion' => $this->ubicacion,
            'servicio' => $this->servicio,
            
            // Fechas
            'fechaInstalacion' => $this->fecha_instalacion?->format('Y-m-d'),
            'fechaIngreso' => $this->fecha_ingreso?->format('Y-m-d'),
            'vencimientoGarantia' => $this->vencimiento_garantia?->format('Y-m-d'),
            'ultimaCalibracion' => $this->ultima_calibracion?->format('Y-m-d'),
            'ultimaInspeccion' => $this->ultima_inspeccion?->format('Y-m-d'),
            'fechaRetiro' => $this->fecha_retiro?->format('Y-m-d'),
            
            // Procedencia y proveedor
            'procedencia' => $this->procedencia,
            'proveedorNombre' => $this->proveedor_nombre,
            'proveedorDireccion' => $this->proveedor_direccion,
            'proveedorTelefono' => $this->proveedor_telefono,
            
            // Especificaciones técnicas
            'voltaje' => $this->voltaje,
            'corriente' => $this->corriente,
            'potencia' => $this->potencia,
            'frecuencia' => $this->frecuencia,
            'otrosEspecificaciones' => $this->otros_especificaciones,
            
            // Accesorios
            'accesoriosConsumibles' => $this->accesorios_consumibles,
            
            // Estado y clasificación
            'estado' => $this->estado,
            'estadoEquipo' => $this->estado_equipo,
            'esCritico' => $this->es_critico,
            
            // Manuales
            'manualUsuario' => $this->manual_usuario,
            'manualServicio' => $this->manual_servicio,
            
            // Nivel de riesgo
            'nivelRiesgo' => $this->nivel_riesgo,
            
            // Observaciones
            'observaciones' => $this->observaciones,
            
            // Foto
            'fotoUrl' => $this->foto_url,
            
            // Timestamps
            'createdAt' => $this->created_at?->format('Y-m-d H:i:s'),
            'updatedAt' => $this->updated_at?->format('Y-m-d H:i:s'),
            
            'documentos' => $this->whenLoaded('documentos', function () {
                return $this->documentos->map(function ($doc) {
                    return [
                        'id' => $doc->id,
                        'nombre' => $doc->nombre_archivo,
                        'tipo' => $doc->tipo_archivo,
                        'tamano_kb' => $doc->tamano_kb,
                        'url' => $doc->url_archivo,
                        'fechaSubida' => $doc->created_at?->format('Y-m-d'),
                        'subidoPor' => $doc->subido_por ? $doc->subido_por->nombre : null,
                    ];
                });
            }),
            
            // Relaciones (opcional, solo si están cargadas)
            'ordenesTrabajo' => OrdenTrabajoResource::collection($this->whenLoaded('ordenesTrabajo')),
            'mantenimientos' => MantenimientoResource::collection($this->whenLoaded('mantenimientosPreventivos')),
        ];
    }
}
