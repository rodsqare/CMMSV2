<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:255',
            'correo' => 'required|email|unique:usuarios,correo|max:255',
            'contrasena' => 'required|string|min:6|max:255',
            'rol' => 'required|in:Técnico,Supervisor,Administrador',
            'especialidad' => 'nullable|string|max:255',
            'estado' => 'nullable|in:Activo,Inactivo',
            'permisos' => 'nullable|array',
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre es obligatorio',
            'correo.required' => 'El correo es obligatorio',
            'correo.unique' => 'Este correo ya está registrado',
            'correo.email' => 'El correo debe ser válido',
            'contrasena.required' => 'La contraseña es obligatoria',
            'contrasena.min' => 'La contraseña debe tener al menos 6 caracteres',
            'rol.required' => 'El rol es obligatorio',
            'rol.in' => 'El rol debe ser Técnico, Supervisor o Administrador',
        ];
    }
}
