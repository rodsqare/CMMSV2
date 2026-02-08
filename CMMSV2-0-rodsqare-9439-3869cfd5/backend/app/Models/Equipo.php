<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Equipo extends Model
{
    use HasFactory;
    
    protected $table = 'equipos';
    
    protected $primaryKey = 'id_equipo';
    
    protected $fillable = [
        // Información básica
        'nombre_equipo',
        'fabricante',
        'modelo',
        'numero_serie',
        'codigo_institucional',
        
        // Ubicación y servicio
        'ubicacion',
        'servicio',
        
        // Fechas
        'fecha_instalacion',
        'fecha_ingreso',
        'vencimiento_garantia',
        'ultima_calibracion',
        'ultima_inspeccion',
        'fecha_retiro',
        
        // Procedencia y proveedor
        'procedencia',
        'proveedor_nombre',
        'proveedor_direccion',
        'proveedor_telefono',
        
        // Especificaciones técnicas
        'voltaje',
        'corriente',
        'potencia',
        'frecuencia',
        'otros_especificaciones',
        
        // Accesorios
        'accesorios_consumibles',
        
        // Estado y clasificación
        'estado',
        'estado_equipo',
        'es_critico',
        
        // Manuales
        'manual_usuario',
        'manual_servicio',
        
        // Nivel de riesgo
        'nivel_riesgo',
        
        // Observaciones
        'observaciones',
        
        // Foto
        'foto_url',
    ];
    
    protected $casts = [
        'fecha_instalacion' => 'date',
        'fecha_ingreso' => 'date',
        'vencimiento_garantia' => 'date',
        'ultima_calibracion' => 'date',
        'ultima_inspeccion' => 'date',
        'fecha_retiro' => 'date',
        'es_critico' => 'boolean',
        'manual_usuario' => 'boolean',
        'manual_servicio' => 'boolean',
    ];

    // Relaciones
    public function ordenesTrabajo()
    {
        return $this->hasMany(OrdenTrabajo::class, 'id_equipo');
    }

    public function mantenimientosPreventivos()
    {
        return $this->hasMany(MantenimientoPreventivo::class, 'id_equipo');
    }

    public function historialTareas()
    {
        return $this->hasMany(HistorialTarea::class, 'id_equipo');
    }

    public function documentos()
    {
        return $this->hasMany(Documento::class, 'equipo_id', 'id_equipo');
    }
    
    // Scopes útiles
    public function scopeOperativos($query)
    {
        return $query->where('estado', 'operativo');
    }
    
    public function scopeCriticos($query)
    {
        return $query->where('es_critico', true);
    }
    
    public function scopePorServicio($query, $servicio)
    {
        return $query->where('servicio', $servicio);
    }
    
    public function scopePorNivelRiesgo($query, $nivel)
    {
        return $query->where('nivel_riesgo', $nivel);
    }
}
