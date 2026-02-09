// Module loading optimization utilities
// Prevents duplicate requests and handles race conditions

type CacheEntry<T> = {
  data: T
  timestamp: number
  expiresIn: number
}

const moduleCache = new Map<string, CacheEntry<any>>()
const loadingPromises = new Map<string, Promise<any>>()
let debounceTimers = new Map<string, NodeJS.Timeout>()

// Cache TTL in milliseconds - default 5 minutes
const DEFAULT_CACHE_TTL = 5 * 60 * 1000

export function isCacheValid<T>(key: string, ttl: number = DEFAULT_CACHE_TTL): T | null {
  const entry = moduleCache.get(key)
  if (!entry) return null

  const isExpired = Date.now() - entry.timestamp > ttl
  if (isExpired) {
    moduleCache.delete(key)
    return null
  }

  return entry.data as T
}

export function setCacheEntry<T>(key: string, data: T, ttl: number = DEFAULT_CACHE_TTL): void {
  moduleCache.set(key, {
    data,
    timestamp: Date.now(),
    expiresIn: ttl,
  })
}

export function clearCache(key?: string): void {
  if (key) {
    moduleCache.delete(key)
  } else {
    moduleCache.clear()
  }
}

/**
 * Deduplicate concurrent requests - if a request is already in flight, return the same promise
 */
export async function deduplicateRequest<T>(
  key: string,
  loader: () => Promise<T>,
  cacheTTL: number = DEFAULT_CACHE_TTL
): Promise<T> {
  // Check cache first
  const cached = isCacheValid<T>(key, cacheTTL)
  if (cached) {
    console.log(`[v0] Module loader - Cache hit for: ${key}`)
    return cached
  }

  // If already loading, return the existing promise
  if (loadingPromises.has(key)) {
    console.log(`[v0] Module loader - Reusing in-flight request for: ${key}`)
    return loadingPromises.get(key)!
  }

  // Start new request
  console.log(`[v0] Module loader - Starting new request for: ${key}`)
  const promise = loader()
    .then((data) => {
      setCacheEntry(key, data, cacheTTL)
      loadingPromises.delete(key)
      return data
    })
    .catch((error) => {
      loadingPromises.delete(key)
      throw error
    })

  loadingPromises.set(key, promise)
  return promise
}

/**
 * Debounce module loading - useful when user is rapidly changing filters or pages
 */
export function debounceModuleLoad<T>(
  key: string,
  loader: () => Promise<T>,
  delayMs: number = 300,
  onLoad?: (data: T) => void
): () => void {
  // Clear existing timer for this key
  if (debounceTimers.has(key)) {
    clearTimeout(debounceTimers.get(key)!)
  }

  return () => {
    const timer = setTimeout(async () => {
      try {
        console.log(`[v0] Module loader - Debounce loading: ${key}`)
        const data = await deduplicateRequest(key, loader)
        onLoad?.(data)
      } catch (error) {
        console.error(`[v0] Module loader - Error loading ${key}:`, error)
      } finally {
        debounceTimers.delete(key)
      }
    }, delayMs)

    debounceTimers.set(key, timer)
  }
}

/**
 * Abortable request - can cancel in-flight requests when component unmounts or conditions change
 */
export class AbortableModuleLoader {
  private abortController: AbortController
  private key: string

  constructor(key: string) {
    this.key = key
    this.abortController = new AbortController()
  }

  async load<T>(loader: (signal: AbortSignal) => Promise<T>): Promise<T> {
    return deduplicateRequest(this.key, () => loader(this.abortController.signal))
  }

  abort(): void {
    this.abortController.abort()
    console.log(`[v0] Module loader - Aborted request: ${this.key}`)
  }

  reset(): void {
    this.abort()
    this.abortController = new AbortController()
    clearCache(this.key)
  }
}

export default {
  isCacheValid,
  setCacheEntry,
  clearCache,
  deduplicateRequest,
  debounceModuleLoad,
  AbortableModuleLoader,
}
