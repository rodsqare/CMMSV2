<?php

namespace App\Services;

use App\Models\Equipo;
use App\Traits\LogsAuditActivity;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EquipoService
{
    use LogsAuditActivity;

    /**
     * Obtener todos los equipos
     */
    public function getAllEquipos(): Collection
    {
        return Equipo::all();
    }

    /**
     * Obtener un equipo por ID
     */
    public function getEquipoById(int $id): ?Equipo
    {
        $equipo = Equipo::find($id);
        if ($equipo) {
            $this->logViewed('equipo', $id);
        }
        return $equipo;
    }

    /**
     * Crear un nuevo equipo
     */
    public function createEquipo(array $data): Equipo
    {
        $equipo = Equipo::create($data);
        $this->logCreated('equipo', $equipo);
        return $equipo;
    }

    /**
     * Actualizar un equipo existente
     */
    public function updateEquipo(Equipo $equipo, array $data): Equipo
    {
        $usuarioId = isset($data['usuario_id']) ? (int)$data['usuario_id'] : null;
        unset($data['usuario_id']);
        
        $changes = array_diff_assoc($data, $equipo->only(array_keys($data)));
        $equipo->update($data);
        
        $equipoId = $equipo->getKey();
        
        if ($usuarioId) {
            $this->logAudit('actualizar', "Actualizó equipo con ID: {$equipoId}. Campos modificados: " . implode(', ', array_keys($changes)), $usuarioId);
        } else {
            $this->logAudit('actualizar', "Actualizó equipo con ID: {$equipoId}. Campos modificados: " . implode(', ', array_keys($changes)));
        }
        
        return $equipo->fresh();
    }

    /**
     * Eliminar un equipo
     */
    public function deleteEquipo(Equipo $equipo): bool
    {
        $id = $equipo->id;
        $deleted = $equipo->delete();
        if ($deleted) {
            $this->logDeleted('equipo', $id);
        }
        return $deleted;
    }

    /**
     * Obtener equipos por estado
     */
    public function getEquiposByEstado(string $estado): Collection
    {
        return Equipo::where('estado', $estado)->get();
    }

    /**
     * Obtener equipos por fabricante
     */
    public function getEquiposByFabricante(string $fabricante): Collection
    {
        return Equipo::where('fabricante', $fabricante)->get();
    }

    /**
     * Contar equipos por estado
     */
    public function countByEstado(): array
    {
        return Equipo::selectRaw('estado, COUNT(*) as total')
            ->groupBy('estado')
            ->pluck('total', 'estado')
            ->toArray();
    }
}
