const FX_URL = 'https://api.exchangerate.host/latest?base=EUR&symbols=RON'
const CACHE_TTL_MS = 60_000

type FxCache = {
  rate: number | null
  timestamp: number | null
}

const globalCache: FxCache = (globalThis as any).__fxCache__ ?? { rate: null, timestamp: null }
;(globalThis as any).__fxCache__ = globalCache

export const getRonPerEurRate = async () => {
  const now = Date.now()
  if (globalCache.rate && globalCache.timestamp && now - globalCache.timestamp < CACHE_TTL_MS) {
    return { rate: globalCache.rate, timestamp: globalCache.timestamp, cached: true }
  }

  const response = await fetch(FX_URL)
  if (!response.ok) {
    throw new Error(`exchangerate.host responded with status ${response.status}`)
  }

  const data = await response.json()
  const rate = data?.rates?.RON
  if (typeof rate !== 'number') {
    throw new Error('EUR→RON rate missing or invalid')
  }

  globalCache.rate = rate
  globalCache.timestamp = now

  return { rate, timestamp: now, cached: false }
}

