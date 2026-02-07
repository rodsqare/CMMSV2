<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrdenTrabajoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation()
    {
        $data = $this->all();
        
        if (isset($data['equipo_id']) && !isset($data['id_equipo'])) {
            $data['id_equipo'] = $data['equipo_id'];
        }
        
        if (isset($data['tipo'])) {
            $tipoMap = [
                'preventivo' => 'preventivo',
                'correctivo' => 'correctivo',
                'inspección' => 'inspeccion',
                'inspeccion' => 'inspeccion',
                'inspecccion' => 'inspeccion',
            ];
            
            $data['tipo'] = $tipoMap[strtolower($data['tipo'])] ?? strtolower($data['tipo']);
        }
        
        // Map prioridad values from frontend to database enum values
        if (isset($data['prioridad'])) {
            $prioridadMap = [
                'alta' => 'critica',
                'urgente' => 'critica',
                'critica' => 'critica',
                'media' => 'media',
                'baja' => 'baja',
            ];
            
            $data['prioridad'] = $prioridadMap[strtolower($data['prioridad'])] ?? $data['prioridad'];
        }
        
        // Map estado values from frontend to database enum values
        if (isset($data['estado'])) {
            $estadoMap = [
                'pausada' => 'pospuesta',
                'cancelada' => 'completada', // Map canceled to completed for now
                'pospuesta' => 'pospuesta',
                'abierta' => 'abierta',
                'en_progreso' => 'en_progreso',
                'completada' => 'completada',
            ];
            
            $data['estado'] = $estadoMap[strtolower($data['estado'])] ?? $data['estado'];
        }
        
        $this->merge($data);
    }

    public function rules(): array
    {
        return [
            'id_equipo' => 'required|exists:equipos,id_equipo',
            'tipo' => 'required|in:preventivo,correctivo,inspeccion',
            'descripcion' => 'required|string',
            'prioridad' => 'required|in:baja,media,critica',
            'estado' => 'nullable|in:abierta,en_progreso,completada,pospuesta',
            'tecnico_asignado_id' => 'nullable|exists:usuarios,id',
            'fecha_inicio' => 'nullable|date',
            'fecha_finalizacion' => 'nullable|date',
            'horas_trabajadas' => 'nullable|numeric|min:0',
            'costo_repuestos' => 'nullable|numeric|min:0',
            'costo_total' => 'nullable|numeric|min:0',
            'observaciones' => 'nullable|string',
            'notas' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'id_equipo.required' => 'El equipo es obligatorio',
            'id_equipo.exists' => 'El equipo seleccionado no existe',
            'tipo.required' => 'El tipo de mantenimiento es obligatorio',
            'tipo.in' => 'El tipo debe ser preventivo, correctivo o inspección',
            'descripcion.required' => 'La descripción es obligatoria',
            'prioridad.required' => 'La prioridad es obligatoria',
            'prioridad.in' => 'La prioridad debe ser baja, media o crítica',
            'estado.in' => 'El estado no es válido',
            'tecnico_asignado_id.exists' => 'El técnico seleccionado no existe',
        ];
    }
}
