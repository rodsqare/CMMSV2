"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-in-production"

export async function validateLogin(email: string, password: string) {
  console.log("[v0] ====== SERVER ACTION: validateLogin ======")
  console.log("[v0] Email:", email)
  console.log("[v0] Password provided:", !!password)

  if (!email || !password) {
    console.log("[v0] Missing credentials")
    return {
      success: false,
      error: "Por favor ingresa correo y contraseña",
    }
  }

  try {
    console.log("[v0] Searching for user in database...")
    
    // Find user by email (using Prisma model field names)
    const user = await prisma.usuario.findUnique({
      where: { email: email }
    })

    if (!user) {
      console.log("[v0] User not found")
      return {
        success: false,
        error: "Credenciales incorrectas",
      }
    }

    console.log("[v0] User found, verifying password...")
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      console.log("[v0] Invalid password")
      return {
        success: false,
        error: "Credenciales incorrectas",
      }
    }

    // Check if user is active
    if (!user.activo) {
      console.log("[v0] User is not active")
      return {
        success: false,
        error: "Usuario inactivo. Contacta al administrador.",
      }
    }

    console.log("[v0] Login successful! Generating token...")

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.rol,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    console.log("[v0] User authenticated successfully")

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.nombre,
        role: user.rol.toLowerCase(),
        especialidad: undefined,
        estado: user.activo ? 'activo' : 'inactivo',
      },
      token,
    }
  } catch (error) {
    console.error("[v0] ====== SERVER ACTION ERROR ======")
    console.error("[v0] Error:", error)

    return {
      success: false,
      error: "Error al iniciar sesión. Por favor intenta nuevamente.",
    }
  }
}
