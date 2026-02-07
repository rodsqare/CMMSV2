<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMantenimientoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_equipo' => 'required|exists:equipos,id_equipo',
            'tipo' => 'required|in:calibracion,inspeccion,limpieza,Calibración,Inspección,Limpieza',
            'frecuencia' => 'required|in:mensual,trimestral,semestral,anual,Mensual,Trimestral,Semestral,Anual',
            'proxima_fecha' => 'required|date',
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
            // If already lowercase, use as is, otherwise map from capitalized
            if (isset($tipoMap[$tipo])) {
                $this->merge(['tipo' => $tipoMap[$tipo]]);
            } else {
                // Already lowercase, ensure it's valid
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
        } else {
            // Set default if not provided
            $this->merge(['resultado' => 'pendiente']);
        }
    }

    public function messages(): array
    {
        return [
            'id_equipo.required' => 'El equipo es obligatorio',
            'id_equipo.exists' => 'El equipo seleccionado no existe',
            'tipo.required' => 'El tipo de mantenimiento es obligatorio',
            'tipo.in' => 'El tipo debe ser: calibración, inspección o limpieza',
            'frecuencia.required' => 'La frecuencia es obligatoria',
            'frecuencia.in' => 'La frecuencia debe ser: mensual, trimestral, semestral o anual',
            'proxima_fecha.required' => 'La próxima fecha es obligatoria',
            'proxima_fecha.date' => 'La próxima fecha debe ser válida',
            'resultado.in' => 'El resultado debe ser: completado, pendiente o vencido',
            'responsable_id.exists' => 'El usuario responsable seleccionado no existe',
        ];
    }
}
