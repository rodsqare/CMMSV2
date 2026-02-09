// Server-side API client - Using Next.js API Routes instead of Laravel backend
// This is used by Server Actions and cannot use localStorage or browser APIs

// Use Next.js API routes instead of external backend
const BACKEND_URL = process.env.BACKEND_URL || "/api"

class ServerApiClient {
  private baseUrl: string
  private useNextApi: boolean

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    // Detect if we should use Next.js API routes (when BACKEND_URL not set or is /api)
    this.useNextApi = !process.env.BACKEND_URL || baseUrl === "/api"
    console.log("[v0] ServerApiClient initialized - backend URL:", baseUrl, "useNextApi:", this.useNextApi)
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    params?: Record<string, any>,
    userId?: string,
    token?: string
  ): Promise<T> {
    // If using Next.js API, build the proper URL and make the request
    let finalBaseUrl = this.baseUrl
    if (this.useNextApi && typeof window === 'undefined') {
      // On server side, use absolute URL
      finalBaseUrl = 'http://localhost:3000'
    }

    let url = `${finalBaseUrl}${endpoint}`

    // Add query parameters
    if (params) {
      const queryParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
      const queryString = queryParams.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    }

    // Add auth token if provided
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    // Add user ID header if provided
    if (userId) {
      headers["X-User-ID"] = String(userId)
      console.log(`[v0] ServerApiClient: Adding X-User-ID header: ${userId}`)
    }

    console.log(`[v0] ServerApiClient: ${options.method || "GET"} ${url}`)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[v0] ServerApiClient error: ${response.status} ${response.statusText}`, errorText)
        throw new Error(
          `API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`
        )
      }

      const data = await response.json()
      return data as T
    } catch (error) {
      console.error("[v0] ServerApiClient request failed:", error)
      throw error
    }
  }

  get<T>(endpoint: string, params?: Record<string, any>, userId?: string, token?: string) {
    return this.request<T>(endpoint, { method: "GET" }, params, userId, token)
  }

  post<T>(endpoint: string, body: unknown, userId?: string, token?: string) {
    return this.request<T>(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      undefined,
      userId,
      token
    )
  }

  put<T>(endpoint: string, body: unknown, userId?: string, token?: string) {
    return this.request<T>(
      endpoint,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
      undefined,
      userId,
      token
    )
  }

  delete<T>(endpoint: string, params?: Record<string, any>, userId?: string, token?: string) {
    return this.request<T>(endpoint, { method: "DELETE" }, params, userId, token)
  }
}

export const serverApiClient = new ServerApiClient(BACKEND_URL)
