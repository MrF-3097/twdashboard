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
 * Centralized helper that attaches auth headers and sane defaults for REBS calls.
 */
export const rebsFetch = (pathname: string, init: RequestInit = {}) => {
  ensureRebsEnv()

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Token ${REBS_API_TOKEN}`)
  headers.set('Accept', 'application/json')

  const isMultipart = init.body instanceof FormData
  if (!isMultipart && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(buildRebsUrl(pathname), {
    cache: 'no-store',
    ...init,
    headers,
  })
}


