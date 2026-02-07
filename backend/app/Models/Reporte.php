<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reporte extends Model
{
    protected $table = 'reportes';
    protected $fillable = ['tipo_reporte', 'generado_por_id', 'parametros', 'url_archivo'];
    protected $casts = [
        'parametros' => 'array',
    ];

    public function generado_por()
    {
        return $this->belongsTo(Usuario::class, 'generado_por_id');
    }
}
