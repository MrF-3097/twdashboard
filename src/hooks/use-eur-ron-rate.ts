import { useCallback, useEffect, useState } from 'react'

export interface EurRonRateState {
  rate: number | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const DEFAULT_ENDPOINT = '/api/fx/eur-ron'
const REFRESH_INTERVAL_MS = 5 * 60 * 1000

export const useEurRonRate = (endpoint: string = DEFAULT_ENDPOINT): EurRonRateState => {
  const [rate, setRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRate = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      if (typeof data?.ronPerEur !== 'number') {
        throw new Error('Invalid FX payload')
      }
      setRate(data.ronPerEur)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load rate'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    let cancelled = false

    const safeFetch = async () => {
      if (cancelled) return
      await fetchRate()
    }

    safeFetch()
    const interval = setInterval(safeFetch, REFRESH_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [fetchRate])

  return {
    rate,
    loading,
    error,
    refresh: fetchRate,
  }
}
