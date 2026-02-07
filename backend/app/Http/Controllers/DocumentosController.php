<?php

namespace App\Http\Controllers;

use App\Models\Documento;
use App\Models\Equipo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class DocumentosController extends Controller
{
    // Get all documents for a specific equipment
    public function index($equipoId)
    {
        $equipo = Equipo::findOrFail($equipoId);
        $documentos = $equipo->documentos()->with('subido_por')->get();

        return response()->json([
            'data' => $documentos->map(function ($doc) {
                return [
                    'id' => $doc->id,
                    'nombre_archivo' => $doc->nombre_archivo,
                    'tipo_archivo' => $doc->tipo_archivo,
                    'tamano_kb' => $doc->tamano_kb,
                    'url_archivo' => $doc->url_archivo,
                    'subido_por' => $doc->subido_por ? $doc->subido_por->nombre : null,
                    'created_at' => $doc->created_at->format('Y-m-d'),
                ];
            })
        ]);
    }

    // Upload a new document
    public function store(Request $request, Equipo $equipo)
    {
        $validator = Validator::make($request->all(), [
            'archivo' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'subido_por_id' => 'nullable|exists:usuarios,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $file = $request->file('archivo');
            
            // Generate unique filename
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $nameWithoutExtension = pathinfo($originalName, PATHINFO_FILENAME);
            $filename = $nameWithoutExtension . '_' . time() . '.' . $extension;
            
            // Store file in storage/app/public/documentos
            $path = $file->storeAs('documentos', $filename, 'public');

            // Create document record
            $documento = Documento::create([
                'equipo_id' => $equipo->id_equipo,
                'nombre_archivo' => $originalName,
                'tipo_archivo' => $extension,
                'tamano_kb' => round($file->getSize() / 1024),
                'url_archivo' => $path,
                'subido_por_id' => $request->subido_por_id ?? auth()->id() ?? 1,
            ]);

            $documento->load('subido_por');

            return response()->json([
                'message' => 'Documento subido exitosamente',
                'data' => [
                    'id' => $documento->id,
                    'nombre' => $documento->nombre_archivo,
                    'nombreArchivo' => $documento->nombre_archivo,
                    'tipo_archivo' => $documento->tipo_archivo,
                    'tipoArchivo' => $documento->tipo_archivo,
                    'tamano_kb' => $documento->tamano_kb,
                    'url_archivo' => asset('storage/' . $path),
                    'urlArchivo' => asset('storage/' . $path),
                    'subido_por' => $documento->subido_por?->nombre,
                    'subidoPor' => $documento->subido_por?->nombre,
                    'fecha_subida' => $documento->created_at->format('Y-m-d'),
                    'fechaSubida' => $documento->created_at->format('Y-m-d'),
                    'equipo_id' => $documento->equipo_id,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al subir el documento',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Get a specific document
    public function show($id)
    {
        $documento = Documento::with('subido_por')->findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $documento->id,
                'nombre_archivo' => $documento->nombre_archivo,
                'tipo_archivo' => $documento->tipo_archivo,
                'tamano_kb' => $documento->tamano_kb,
                'url_archivo' => $documento->url_archivo,
                'subido_por' => $documento->subido_por ? $documento->subido_por->nombre : null,
                'created_at' => $documento->created_at->format('Y-m-d'),
            ]
        ]);
    }

    // Download a document
    public function download($id)
    {
        try {
            $documento = Documento::findOrFail($id);
            
            if (!$documento->url_archivo || !Storage::disk('public')->exists($documento->url_archivo)) {
                return response()->json(['error' => 'Archivo no encontrado'], 404);
            }

            return Storage::disk('public')->download($documento->url_archivo, $documento->nombre_archivo);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al descargar el documento',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Delete a document
    public function destroy($id)
    {
        try {
            $documento = Documento::findOrFail($id);
            
            // Delete file from storage
            if ($documento->url_archivo && Storage::disk('public')->exists($documento->url_archivo)) {
                Storage::disk('public')->delete($documento->url_archivo);
            }

            $documento->delete();

            return response()->json([
                'message' => 'Documento eliminado exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al eliminar el documento',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
