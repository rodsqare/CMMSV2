"use server"

import { login } from "@/lib/api/auth"

export async function validateLogin(email: string, password: string) {
  console.log("[v0] ====== SERVER ACTION: validateLogin ======")
  console.log("[v0] Email:", email)
  console.log("[v0] Password provided:", !!password)
  console.log("[v0] Password length:", password?.length)

  if (!email || !password) {
    console.log("[v0] Missing credentials")
    return {
      success: false,
      error: "Por favor ingresa correo y contraseña",
    }
  }

  try {
    console.log("[v0] Calling Laravel /api/login endpoint...")
    const loginResponse = await login({ correo: email, contrasena: password })

    console.log("[v0] ====== LOGIN RESPONSE RECEIVED ======")
    console.log("[v0] Success:", loginResponse.success)
    console.log("[v0] Has user:", !!loginResponse.user)
    console.log("[v0] Has token:", !!loginResponse.token)
    console.log("[v0] Message:", loginResponse.message)

    if (loginResponse.success && loginResponse.user) {
      console.log("[v0] ✓ Login successful!")
      console.log("[v0] User data:", {
        id: loginResponse.user.id,
        nombre: loginResponse.user.nombre,
        rol: loginResponse.user.rol,
      })

      return {
        success: true,
        user: {
          id: loginResponse.user.id,
          email: loginResponse.user.correo,
          name: loginResponse.user.nombre,
          role: loginResponse.user.rol.toLowerCase(),
          especialidad: loginResponse.user.especialidad,
          estado: loginResponse.user.estado,
        },
        token: loginResponse.token,
      }
    } else {
      console.log("[v0] ✗ Laravel login failed")
      return {
        success: false,
        error: loginResponse.message || "Credenciales incorrectas",
      }
    }
  } catch (error) {
    console.error("[v0] ====== SERVER ACTION ERROR ======")
    console.error("[v0] Error:", error)

    const errorMessage = error instanceof Error ? error.message : "Error desconocido"

    if (errorMessage.includes("401")) {
      return {
        success: false,
        error: "Credenciales incorrectas. Verifica tu correo y contraseña.",
      }
    }

    if (errorMessage.includes("timeout") || errorMessage.includes("Failed to fetch")) {
      return {
        success: false,
        error: "No se puede conectar al servidor. Verifica que Laravel esté corriendo en http://localhost:8000",
      }
    }

    return {
      success: false,
      error: "Error al conectar con el servidor: " + errorMessage,
    }
  }
}
