<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OrdenesTrabajoController;
use App\Http\Controllers\ReportesController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UsuariosController;
use App\Http\Controllers\EquiposController;
use App\Http\Controllers\NotificacionesController;
use App\Http\Controllers\MantenimientoController;
use App\Http\Controllers\LogsAuditoriaController;
use App\Http\Controllers\DocumentosController;

Route::middleware(['api'])->group(function () {
    // Auth routes
    Route::post('login', [AuthController::class, 'login']); // Added generic login route to match frontend request
    Route::post('auth/login', [AuthController::class, 'login']);

    // Dashboard route
    Route::get('dashboard', [DashboardController::class, 'index']);

    // Usuarios routes
    // Custom routes must be defined before resource routes to avoid conflict with {usuario} parameter
    Route::patch('usuarios/{id}/estado', [UsuariosController::class, 'patch']);
    Route::post('usuarios/{usuario}/reset-password', [UsuariosController::class, 'resetPassword']);
    Route::get('usuarios/{usuario}/activity', [UsuariosController::class, 'activity']);
    Route::apiResource('usuarios', UsuariosController::class);

    // Equipos routes
    Route::get('equipos/{equipo}/associations', [EquiposController::class, 'getAssociations']); // Check equipment associations for delete validation
    Route::apiResource('equipos', EquiposController::class)
        ->parameters(['equipos' => 'equipo']);

    // Documentos routes for equipos
    Route::get('equipos/{equipo}/documentos', [DocumentosController::class, 'index']);
    Route::post('equipos/{equipo}/documentos', [DocumentosController::class, 'store']);
    Route::get('documentos/{id}', [DocumentosController::class, 'show']);
    Route::get('documentos/{id}/download', [DocumentosController::class, 'download']);
    Route::delete('documentos/{id}', [DocumentosController::class, 'destroy']);

    // Órdenes de Trabajo - Custom routes (must be before resource routes)
    Route::post('ordenes-trabajo/{orden}/asignar-tecnico', [OrdenesTrabajoController::class, 'asignarTecnico']);
    Route::post('ordenes-trabajo/{orden}/cambiar-estado', [OrdenesTrabajoController::class, 'cambiarEstado']);
    Route::get('ordenes-trabajo/{orden}/export-pdf', [OrdenesTrabajoController::class, 'exportPDF']);
    
    // Órdenes de Trabajo - Resource routes
    Route::apiResource('ordenes-trabajo', OrdenesTrabajoController::class)
        ->parameters(['ordenes-trabajo' => 'orden']);

    // Mantenimientos routes
    Route::get('mantenimientos/stats', [MantenimientoController::class, 'stats']);
    Route::post('mantenimientos/check-upcoming', [MantenimientoController::class, 'checkUpcoming']);
    Route::apiResource('mantenimientos', MantenimientoController::class)
        ->parameters(['mantenimientos' => 'mantenimiento']);

    // Notificaciones
    Route::get('notificaciones', [NotificacionesController::class, 'index']);
    Route::get('notificaciones/unread-count', [NotificacionesController::class, 'unreadCount']);
    Route::post('notificaciones/mark-all-read', [NotificacionesController::class, 'markAllAsRead']);
    Route::post('notificaciones/{id}/mark-read', [NotificacionesController::class, 'markAsRead']);
    Route::delete('notificaciones/{id}', [NotificacionesController::class, 'destroy']);

    // Reportes
    Route::get('reportes/{tipo}', [ReportesController::class, 'show']);

    // Logs de Auditoría
    Route::get('logs-auditoria', [LogsAuditoriaController::class, 'index']);
    Route::get('logs-auditoria/{id}', [LogsAuditoriaController::class, 'show']);
});
