<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasApiTokens;

    protected $table = 'usuarios';
    protected $fillable = ['nombre', 'correo', 'contrasena', 'rol', 'especialidad', 'estado', 'permisos'];
    protected $hidden = ['contrasena'];
    protected $casts = [
        'permisos' => 'array',
    ];

    public function ordenes_trabajo()
    {
        return $this->hasMany(OrdenTrabajo::class, 'tecnico_asignado_id');
    }

    public function documentos()
    {
        return $this->hasMany(Documento::class, 'subido_por_id');
    }

    public function historial_tareas()
    {
        return $this->hasMany(HistorialTarea::class, 'realizado_por_id');
    }

    public function logs_auditoria()
    {
        return $this->hasMany(LogAuditoria::class);
    }

    public function notificaciones()
    {
        return $this->hasMany(Notificacion::class);
    }

    public function reportes()
    {
        return $this->hasMany(Reporte::class, 'generado_por_id');
    }
}
