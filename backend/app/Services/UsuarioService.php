<?php

namespace App\Services;

use App\Models\Usuario;
use App\Traits\LogsAuditActivity;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UsuarioService
{
    use LogsAuditActivity;

    /**
     * Obtener todos los usuarios
     */
    public function getAllUsuarios(): Collection
    {
        return Usuario::all();
    }

    /**
     * Obtener un usuario por ID
     */
    public function getUsuarioById(int $id): ?Usuario
    {
        $usuario = Usuario::find($id);
        if ($usuario) {
            $this->logViewed('usuario', $id);
        }
        return $usuario;
    }

    /**
     * Crear un nuevo usuario
     */
    public function createUsuario(array $data): Usuario
    {
        Log::info('[UsuarioService] Creating usuario with data', ['data' => array_keys($data)]);
        
        if (isset($data['contrasena'])) {
            Log::info('[UsuarioService] Hashing password');
            $data['contrasena'] = Hash::make($data['contrasena']);
        }
        
        if (!isset($data['estado'])) {
            $data['estado'] = 'activo';
        } else {
            // Normalize estado to lowercase
            $data['estado'] = strtolower($data['estado']);
        }
        
        Log::info('[UsuarioService] Creating usuario in database');
        $usuario = Usuario::create($data);
        
        Log::info('[UsuarioService] Usuario created', ['id' => $usuario->id]);
        
        $this->logCreated('usuario', $usuario);
        
        return $usuario;
    }

    /**
     * Actualizar un usuario existente
     */
    public function updateUsuario(Usuario $usuario, array $data): Usuario
    {
        Log::info('[UsuarioService] Updating usuario', [
            'id' => $usuario->id,
            'fields' => array_keys($data),
            'estado_before' => $usuario->estado
        ]);
        
        if (isset($data['contrasena']) && !empty($data['contrasena'])) {
            Log::info('[UsuarioService] Updating password');
            $data['contrasena'] = Hash::make($data['contrasena']);
        } else {
            // Don't update password if not provided
            unset($data['contrasena']);
        }
        
        if (isset($data['estado'])) {
            $data['estado'] = strtolower(trim($data['estado']));
            Log::info('[UsuarioService] Normalized estado', ['estado' => $data['estado']]);
        }
        
        $trackableData = array_diff_key($data, ['contrasena' => '']);
        $changes = array_diff_assoc($trackableData, $usuario->only(array_keys($trackableData)));
        
        $usuario->update($data);
        
        $usuario = $usuario->fresh();
        Log::info('[UsuarioService] Usuario updated successfully', [
            'estado_after' => $usuario->estado
        ]);
        
        $this->logUpdated('usuario', $usuario, $changes);
        
        return $usuario;
    }

    /**
     * Eliminar un usuario
     */
    public function deleteUsuario(Usuario $usuario): bool
    {
        Log::info('[UsuarioService] Deleting usuario', ['id' => $usuario->id]);
        $id = $usuario->id;
        $deleted = $usuario->delete();
        if ($deleted) {
            $this->logDeleted('usuario', $id);
        }
        return $deleted;
    }

    /**
     * Obtener usuarios por rol
     */
    public function getUsuariosByRol(string $rol): Collection
    {
        return Usuario::where('rol', $rol)->get();
    }

    /**
     * Verificar si el email ya existe
     */
    public function emailExists(string $email, ?int $excludeId = null): bool
    {
        $query = Usuario::where('correo', $email);
        
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        
        return $query->exists();
    }

    /**
     * Restablecer contraseña de un usuario
     */
    public function resetPassword(Usuario $usuario, string $newPassword): Usuario
    {
        Log::info('[UsuarioService] Resetting password for usuario', ['id' => $usuario->id]);
        
        $usuario->update([
            'contrasena' => Hash::make($newPassword)
        ]);
        
        $this->logAudit('actualizar', "Restableció contraseña de usuario ID: {$usuario->id}");
        
        return $usuario->fresh();
    }
}
