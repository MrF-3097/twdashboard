const DEFAULT_BASE_URL = 'https://towerimob.crmrebs.com/api'

export const REBS_PRIVATE_API_BASE =
  process.env.REBS_PRIVATE_API_BASE?.replace(/\/+$/, '') || DEFAULT_BASE_URL

export const REBS_API_TOKEN =
  process.env.REBS_API_TOKEN || process.env.REBS_WRITE_API_KEY || process.env.REBS_API_KEY

/**
 * Ensures we have the credentials required to communicate with the private REBS API.
 */
export const ensureRebsEnv = () => {
  if (!REBS_API_TOKEN) {
    throw new Error('Missing REBS_API_TOKEN environment variable for authenticated requests.')
  }
}

const buildRebsUrl = (pathname: string) => {
  if (!pathname) {
    return REBS_PRIVATE_API_BASE
  }
  if (/^https?:\/\//i.test(pathname)) {
    return pathname
  }
  if (pathname.startsWith('/')) {
    return `${REBS_PRIVATE_API_BASE}${pathname}`
  }
  return `${REBS_PRIVATE_API_BASE}/${pathname}`
}

/**
 * Default timeout for REBS API requests (30 seconds)
 */
const DEFAULT_TIMEOUT_MS = 30000

/**
 * Centralized helper that attaches auth headers and sane defaults for REBS calls.
 * Includes automatic timeout handling via AbortController.
 */
export const rebsFetch = (pathname: string, init: RequestInit = {}) => {
  ensureRebsEnv()
  
  const fullUrl = buildRebsUrl(pathname)
  console.log(`[rebsFetch] Fetching: ${fullUrl}`)
  console.log(`[rebsFetch] Token (first 10 chars): ${REBS_API_TOKEN?.substring(0, 10)}...`)

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Token ${REBS_API_TOKEN}`)
  headers.set('Accept', 'application/json')

  const isMultipart = init.body instanceof FormData
  if (!isMultipart && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Get timeout from init or use default
  const timeoutMs = (init as any).timeout || DEFAULT_TIMEOUT_MS
  
  // Create AbortController for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  // If init already has a signal, we need to combine them
  // For now, we'll use our timeout signal
  const signal = init.signal || controller.signal

  // Clean up timeout if request completes
  const fetchPromise = fetch(fullUrl, {
    cache: 'no-store',
    ...init,
    headers,
    signal,
  }).finally(() => {
    clearTimeout(timeoutId)
  })

  // Wrap to handle timeout errors
  return fetchPromise.catch((error) => {
    if (error.name === 'AbortError' && controller.signal.aborted) {
      throw new Error(`Request timeout after ${timeoutMs}ms: ${pathname}`)
    }
    throw error
  })
}



