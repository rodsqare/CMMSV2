import { apiClient } from "./client"

export type LoginCredentials = {
  correo: string
  contrasena: string
}

export type LoginResponse = {
  success: boolean
  token?: string
  user?: {
    id: number
    nombre: string
    correo: string
    rol: string
    especialidad?: string
    estado: string
    permisos?: any
  }
  message?: string
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  console.log("[v0] ========== LOGIN REQUEST ==========")
  console.log("[v0] Correo:", credentials.correo)
  console.log("[v0] Contraseña length:", credentials.contrasena.length)
  console.log("[v0] Contraseña first 3 chars:", credentials.contrasena.substring(0, 3) + "...")

  try {
    const response = await apiClient.post<any>("/login", {
      correo: credentials.correo,
      contrasena: credentials.contrasena,
    })

    console.log("[v0] ========== LOGIN RESPONSE ==========")
    console.log("[v0] Full response:", JSON.stringify(response, null, 2))

    // Laravel might return the data in different formats
    if (response.success || response.user || response.token) {
      return {
        success: true,
        token: response.token,
        user: response.user,
      }
    }

    return {
      success: false,
      message: response.message || "Error en el inicio de sesión",
    }
  } catch (error) {
    console.error("[v0] ========== LOGIN ERROR ==========")
    console.error("[v0] Error type:", error instanceof Error ? error.constructor.name : typeof error)
    console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[v0] Full error:", error)
    throw error
  }
}

export async function logout(token?: string): Promise<void> {
  try {
    await apiClient.post("/logout", {})
    console.log("[v0] Logged out successfully")
  } catch (error) {
    console.error("[v0] Logout error:", error)
  }
}
