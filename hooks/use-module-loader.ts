import { useEffect, useRef, useState, useCallback } from 'react'
import { deduplicateRequest, AbortableModuleLoader, clearCache } from '@/lib/utils/module-loader'

interface UseModuleLoaderOptions {
  cacheTTL?: number
  retryOnError?: boolean
  onError?: (error: Error) => void
  onSuccess?: (data: any) => void
}

/**
 * Hook to efficiently load modules with deduplication, caching, and abort capability
 * 
 * @param key - Unique identifier for this module
 * @param loader - Async function that loads the data
 * @param options - Configuration options
 * @returns { data, loading, error, refetch, clearCache }
 */
export function useModuleLoader<T>(
  key: string,
  loader: () => Promise<T>,
  options: UseModuleLoaderOptions = {}
) {
  const { cacheTTL = 5 * 60 * 1000, retryOnError = true, onError, onSuccess } = options
  
  const loaderRef = useRef(new AbortableModuleLoader(key))
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const retryCountRef = useRef(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      console.log(`[v0] useModuleLoader - Loading ${key}`)
      const result = await deduplicateRequest(key, loader, cacheTTL)
      setData(result)
      onSuccess?.(result)
      retryCountRef.current = 0
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      
      // Don't log AbortError - it's expected when unmounting
      if (error.name !== 'AbortError') {
        console.error(`[v0] useModuleLoader - Error loading ${key}:`, error)
        
        if (retryOnError && retryCountRef.current < 2) {
          retryCountRef.current++
          console.log(`[v0] useModuleLoader - Retrying ${key} (attempt ${retryCountRef.current})`)
          setTimeout(load, 1000 * retryCountRef.current)
        } else {
          setError(error)
          onError?.(error)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [key, loader, cacheTTL, retryOnError, onError, onSuccess])

  useEffect(() => {
    load()

    return () => {
      loaderRef.current.abort()
    }
  }, [load])

  const refetch = useCallback(() => {
    clearCache(key)
    loaderRef.current.reset()
    load()
  }, [key, load])

  const clearCacheManually = useCallback(() => {
    clearCache(key)
  }, [key])

  return {
    data,
    loading,
    error,
    refetch,
    clearCache: clearCacheManually,
  }
}

export default useModuleLoader
