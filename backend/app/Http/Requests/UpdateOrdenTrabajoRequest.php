<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrdenTrabajoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
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
                'pospuesta' => 'pospuesta',
                'abierta' => 'abierta',
                'en progreso' => 'en_progreso', // Handle space
                'en_progreso' => 'en_progreso',
                'completada' => 'completada',
                'cancelada' => 'cancelada', // Allow cancelada directly
            ];
            
            $data['estado'] = $estadoMap[strtolower($data['estado'])] ?? $data['estado'];
        }
        
        $this->merge($data);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules(): array
    {
        return [
            'id_equipo' => 'nullable|exists:equipos,id_equipo',
            'tipo' => 'nullable|in:preventivo,correctivo,inspeccion',
            'descripcion' => 'nullable|string',
            'prioridad' => 'nullable|in:baja,media,critica',
            'estado' => 'nullable|in:abierta,en_progreso,completada,pospuesta,cancelada', // Added cancelada
            'tecnico_asignado_id' => 'nullable|exists:usuarios,id',
            'fecha_vencimiento' => 'nullable|date',
            'fecha_inicio' => 'nullable|date',
            'fecha_finalizacion' => 'nullable|date',
            'horas_trabajadas' => 'nullable|numeric|min:0',
            'costo_repuestos' => 'nullable|numeric|min:0',
            'costo_total' => 'nullable|numeric|min:0',
            'costo_estimado' => 'nullable|numeric|min:0',
            'observaciones' => 'nullable|string',
            'notas' => 'nullable|string',
        ];
    }
}
