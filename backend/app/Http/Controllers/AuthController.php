<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login de usuario
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'correo' => 'required|email',
            'contrasena' => 'required|string',
        ]);

        Log::info('[Auth] Login attempt', ['correo' => $request->correo]);

        // Buscar usuario por correo
        $usuario = Usuario::where('correo', $request->correo)->first();

        if (!$usuario) {
            Log::warning('[Auth] User not found', ['correo' => $request->correo]);
            return response()->json([
                'success' => false,
                'message' => 'Credenciales incorrectas'
            ], 401);
        }

        if (!Hash::check($request->contrasena, $usuario->contrasena)) {
            Log::warning('[Auth] Invalid password', [
                'correo' => $request->correo,
                'hash_in_db' => substr($usuario->contrasena, 0, 20) . '...'
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Credenciales incorrectas'
            ], 401);
        }

        // Verificar que el usuario esté activo (case-insensitive)
        if (strtolower($usuario->estado) !== 'activo') {
            Log::warning('[Auth] Inactive user', [
                'correo' => $request->correo,
                'estado' => $usuario->estado
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Usuario inactivo'
            ], 403);
        }

        // Revoke all previous tokens for this user
        $usuario->tokens()->delete();
        
        // Create new token
        $token = $usuario->createToken('auth-token')->plainTextToken;

        Log::info('[Auth] Login successful', [
            'usuario_id' => $usuario->id,
            'token_created' => true
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Login exitoso',
            'token' => $token, // Return token to frontend
            'user' => [
                'id' => $usuario->id,
                'nombre' => $usuario->nombre,
                'correo' => $usuario->correo,
                'rol' => $usuario->rol,
                'especialidad' => $usuario->especialidad,
                'estado' => $usuario->estado,
                'permisos' => $usuario->permisos,
            ]
        ], 200);
    }

    /**
     * Logout de usuario
     */
    public function logout(Request $request): JsonResponse
    {
        if ($request->user()) {
            $request->user()->tokens()->delete();
            Log::info('[Auth] Logout - tokens revoked', ['usuario_id' => $request->user()->id]);
        } else {
            Log::info('[Auth] Logout - no authenticated user');
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout exitoso'
        ], 200);
    }

    /**
     * Verificar sesión
     */
    public function verify(Request $request): JsonResponse
    {
        $usuario = $request->user();

        if (!$usuario || strtolower($usuario->estado) !== 'activo') {
            return response()->json([
                'success' => false,
                'message' => 'Sesión inválida'
            ], 401);
        }

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $usuario->id,
                'nombre' => $usuario->nombre,
                'correo' => $usuario->correo,
                'rol' => $usuario->rol,
                'especialidad' => $usuario->especialidad,
                'estado' => $usuario->estado,
                'permisos' => $usuario->permisos,
            ]
        ], 200);
    }
}
