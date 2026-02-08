<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $usuarioId = $this->route('usuario')->id;

        return [
            'nombre' => 'nullable|string|max:255',
            'correo' => 'nullable|email|unique:usuarios,correo,' . $usuarioId . '|max:255',
            'contrasena' => 'nullable|string|min:6|max:255',
            'rol' => 'nullable|in:Técnico,Supervisor,Administrador',
            'especialidad' => 'nullable|string|max:255',
            'estado' => 'nullable|string|in:Activo,Inactivo,activo,inactivo',
            'permisos' => 'nullable|array',
        ];
    }

    public function messages(): array
    {
        return [
            'correo.unique' => 'Este correo ya está registrado',
            'correo.email' => 'El correo debe ser válido',
            'contrasena.min' => 'La contraseña debe tener al menos 6 caracteres',
            'rol.in' => 'El rol debe ser Técnico, Supervisor o Administrador',
            'estado.in' => 'El estado debe ser Activo o Inactivo',
        ];
    }
}
