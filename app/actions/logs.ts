"use server"

import { getAuditLogs } from "@/lib/api/logs"

export async function fetchAuditLogs(search?: string, action?: string, perPage = 10) {
  try {
    const result = await getAuditLogs(search, action, perPage)

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error("[v0] fetchAuditLogs - Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al obtener logs",
    }
  }
}
