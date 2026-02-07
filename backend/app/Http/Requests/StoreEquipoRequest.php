<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEquipoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre_equipo' => 'required|string|max:255',
            'codigo' => 'nullable|string|max:50|unique:equipos,codigo',
            'fabricante' => 'nullable|string|max:255',
            'modelo' => 'nullable|string|max:255',
            'numero_serie' => 'nullable|string|max:255|unique:equipos,numero_serie',
            'codigo_institucional' => 'nullable|string|max:255|unique:equipos,codigo_institucional',
            'ubicacion' => 'nullable|string|max:255',
            'servicio' => 'nullable|string|max:255',
            'fecha_adquisicion' => 'nullable|date',
            'fecha_instalacion' => 'nullable|date',
            'fecha_ingreso' => 'nullable|date',
            'vencimiento_garantia' => 'nullable|date',
            'ultima_calibracion' => 'nullable|date',
            'ultima_inspeccion' => 'nullable|date',
            'fecha_retiro' => 'nullable|date',
            'procedencia' => 'nullable|string|max:255',
            'proveedor_nombre' => 'nullable|string|max:255',
            'proveedor_direccion' => 'nullable|string|max:500',
            'proveedor_telefono' => 'nullable|string|max:50',
            'voltaje' => 'nullable|string|max:50',
            'corriente' => 'nullable|string|max:50',
            'potencia' => 'nullable|string|max:50',
            'frecuencia' => 'nullable|string|max:50',
            'especificaciones' => 'nullable|json',
            'otros_especificaciones' => 'nullable|string',
            'accesorios_consumibles' => 'nullable|string',
            'estado' => 'nullable|in:operativo,en reparacion,fuera de servicio,nuevo,mantenimiento',
            'estado_equipo' => 'nullable|in:nuevo,operativo,no_operable',
            'es_critico' => 'nullable|boolean',
            'manual_usuario' => 'nullable|boolean',
            'manual_servicio' => 'nullable|boolean',
            'nivel_riesgo' => 'nullable|in:alto,medio,bajo',
            'observaciones' => 'nullable|string',
            'foto_url' => 'nullable|string|max:500',
            'activo' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'nombre_equipo.required' => 'El nombre del equipo es obligatorio',
            'codigo.unique' => 'Este código ya existe',
            'fabricante.required' => 'El fabricante es obligatorio',
            'modelo.required' => 'El modelo es obligatorio',
            'numero_serie.unique' => 'El número de serie ya está registrado',
            'codigo_institucional.unique' => 'El código institucional ya está registrado',
            'estado.in' => 'El estado debe ser: operativo, en reparacion, fuera de servicio, nuevo o mantenimiento',
            'estado_equipo.in' => 'El estado del equipo debe ser: nuevo, operado o no_operable',
            'nivel_riesgo.in' => 'El nivel de riesgo debe ser: alto, medio o bajo',
        ];
    }
}
