<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMantenimientoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_equipo' => 'nullable|exists:equipos,id_equipo',
            'tipo' => 'nullable|in:calibracion,inspeccion,limpieza,Calibración,Inspección,Limpieza',
            'frecuencia' => 'nullable|in:mensual,trimestral,semestral,anual,Mensual,Trimestral,Semestral,Anual',
            'proxima_fecha' => 'nullable|date',
            'ultima_fecha' => 'nullable|date',
            'resultado' => 'nullable|in:completado,pendiente,vencido,Completado,Pendiente,Vencido',
            'observaciones' => 'nullable|string',
            'responsable_id' => 'nullable|exists:usuarios,id',
        ];
    }

    public function prepareForValidation()
    {
        $tipoMap = [
            'Calibración' => 'calibracion',
            'Inspección' => 'inspeccion',
            'Limpieza' => 'limpieza',
        ];

        if ($this->has('tipo')) {
            $tipo = $this->tipo;
            if (isset($tipoMap[$tipo])) {
                $this->merge(['tipo' => $tipoMap[$tipo]]);
            } else {
                $this->merge(['tipo' => strtolower($tipo)]);
            }
        }

        $frecuenciaMap = [
            'Mensual' => 'mensual',
            'Trimestral' => 'trimestral',
            'Semestral' => 'semestral',
            'Anual' => 'anual',
        ];

        if ($this->has('frecuencia')) {
            $frecuencia = $this->frecuencia;
            if (isset($frecuenciaMap[$frecuencia])) {
                $this->merge(['frecuencia' => $frecuenciaMap[$frecuencia]]);
            } else {
                $this->merge(['frecuencia' => strtolower($frecuencia)]);
            }
        }

        $resultadoMap = [
            'Pendiente' => 'pendiente',
            'Completado' => 'completado',
            'Vencido' => 'vencido',
        ];

        if ($this->has('resultado')) {
            $resultado = $this->resultado;
            if (isset($resultadoMap[$resultado])) {
                $this->merge(['resultado' => $resultadoMap[$resultado]]);
            } else {
                $this->merge(['resultado' => strtolower($resultado)]);
            }
        }
    }

    public function messages(): array
    {
        return [
            'id_equipo.exists' => 'El equipo seleccionado no existe',
            'tipo.in' => 'El tipo debe ser: calibración, inspección o limpieza',
            'frecuencia.in' => 'La frecuencia debe ser: mensual, trimestral, semestral o anual',
            'proxima_fecha.date' => 'La próxima fecha debe ser una fecha válida',
            'ultima_fecha.date' => 'La última fecha debe ser una fecha válida',
            'resultado.in' => 'El resultado debe ser: completado, pendiente o vencido',
            'responsable_id.exists' => 'El responsable seleccionado no existe',
        ];
    }
}
