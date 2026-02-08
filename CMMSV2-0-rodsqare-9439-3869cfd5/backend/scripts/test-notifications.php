<?php
// Script to test notifications - run with: php backend/scripts/test-notifications.php

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../bootstrap/app.php';

use App\Models\Usuario;
use App\Models\Notificacion;

$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

// Get first user
$usuario = Usuario::first();

if (!$usuario) {
    echo "❌ No users found in database\n";
    exit(1);
}

echo "📝 Testing notifications for user: " . $usuario->email . " (ID: {$usuario->id})\n";

// Check existing notifications
$count = Notificacion::where('usuario_id', $usuario->id)->count();
echo "📊 Existing notifications: $count\n";

// Create test notifications
$tipos = ['warning', 'info', 'success', 'error'];
$mensajes = [
    'El equipo necesita mantenimiento preventivo',
    'Nueva orden de trabajo asignada',
    'Mantenimiento completado exitosamente',
    'Error en sincronización de datos',
];

foreach ($tipos as $index => $tipo) {
    Notificacion::create([
        'usuario_id' => $usuario->id,
        'tipo' => $tipo,
        'titulo' => 'Notificación de Prueba ' . ($index + 1),
        'mensaje' => $mensajes[$index],
        'leida' => false,
    ]);
    echo "✅ Created $tipo notification\n";
}

// Verify creation
$newCount = Notificacion::where('usuario_id', $usuario->id)->count();
echo "\n✅ Total notifications now: $newCount\n";

// Show all notifications
$notificaciones = Notificacion::where('usuario_id', $usuario->id)->get();
foreach ($notificaciones as $notif) {
    echo "  - [{$notif->tipo}] {$notif->titulo}\n";
}
