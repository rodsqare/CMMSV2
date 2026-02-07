"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Lock } from 'lucide-react'
import { validateLogin } from "@/app/actions/auth"
import { getHospitalLogo } from "@/app/actions/configuracion"

// Default demo credentials
const DEMO_USERS = [
  { correo: "admin@hospital.com", nombre: "Administrador", rol: "admin" },
  { correo: "supervisor@hospital.com", nombre: "Supervisor", rol: "supervisor" },
  { correo: "technician@hospital.com", nombre: "Técnico", rol: "tecnico" },
]

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hospitalLogo, setHospitalLogo] = useState<string>(
    "/images/design-mode/Captura%20de%20pantalla%202025-11-07%20193550.png",
  )
  const router = useRouter()

  useEffect(() => {
    const loadLogo = async () => {
      // First try to get from localStorage
      if (typeof window !== 'undefined') {
        const savedLogo = localStorage.getItem("hospitalLogo")
        if (savedLogo) {
          setHospitalLogo(savedLogo)
          return
        }
      }
      
      // If not in localStorage, fetch from database
      try {
        const dbLogo = await getHospitalLogo()
        if (dbLogo) {
          setHospitalLogo(dbLogo)
          // Cache it in localStorage for future visits
          if (typeof window !== 'undefined') {
            localStorage.setItem("hospitalLogo", dbLogo)
          }
        }
      } catch (error) {
        console.error("[v0] Error loading hospital logo:", error)
      }
    }
    
    loadLogo()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    console.log("[v0] Client: Attempting login for:", email)

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Tiempo de espera agotado")), 10000),
      )

      const result = (await Promise.race([validateLogin(email, password), timeoutPromise])) as Awaited<
        ReturnType<typeof validateLogin>
      >

      console.log("[v0] Client: Login result:", result)

      if (!result.success || !result.user) {
        setError(result.error || "Error al iniciar sesión")
        setIsLoading(false)
        return
      }

      localStorage.removeItem("isAuthenticated")
      localStorage.removeItem("authToken")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("userName")
      localStorage.removeItem("userRole")
      localStorage.removeItem("userId")

      const userId = String(result.user.id)
      console.log("[v0] Client: Saving user data to localStorage", {
        userId,
        userEmail: result.user.email,
        userName: result.user.name,
        userRole: result.user.role
      })

      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("userId", userId)
      localStorage.setItem("userEmail", result.user.email)
      localStorage.setItem("userName", result.user.name)
      localStorage.setItem("userRole", result.user.role)

      if (result.token) {
        localStorage.setItem("authToken", result.token)
      }

      console.log("[v0] Client: Verifying localStorage after login:", {
        savedUserId: localStorage.getItem("userId"),
        isAuthenticated: localStorage.getItem("isAuthenticated")
      })

      console.log("[v0] Client: Login successful, redirecting to dashboard")

      router.push("/")
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error"
      console.log("[v0] Client: Login error:", errorMessage)
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        {/* Logo and Hospital Name */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <img
              src={hospitalLogo || "/placeholder.svg?height=100&width=100"}
              alt="Hospital Dr Beningo Sánchez"
              width={100}
              height={100}
              className="object-contain"
            />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Hospital Dr Beningo Sánchez</h1>
          <p className="text-sm text-gray-600">Sistema de Gestión de Equipos Biomédicos</p>
        </div>

        {/* Login Card */}
        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">Iniciar Sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Correo Electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@hospital.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {/* Error Message */}
                {error && <p className="text-sm text-red-500">{error}</p>}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
