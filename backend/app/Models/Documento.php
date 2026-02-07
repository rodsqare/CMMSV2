<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Documento extends Model
{
    protected $table = 'documentos';
    
    protected $fillable = [
        'equipo_id',
        'nombre_archivo',
        'tipo_archivo',
        'tamano_kb',
        'url_archivo',
        'subido_por_id'
    ];

    protected $casts = [
        'tamano_kb' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function equipo()
    {
        return $this->belongsTo(Equipo::class, 'equipo_id', 'id_equipo');
    }

    public function subido_por()
    {
        return $this->belongsTo(Usuario::class, 'subido_por_id');
    }
}
