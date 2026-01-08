import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { leadEvents } from '@/db/schema'
import { logger } from '@/lib/logger'

const REBS_API_BASE = process.env.REBS_PRIVATE_API_BASE || 'https://towerimob.crmrebs.com/api'
const REBS_API_TOKEN = process.env.REBS_API_TOKEN || process.env.REBS_WRITE_API_KEY || process.env.REBS_API_KEY
const REBS_PUBLIC_API_BASE = process.env.REBS_PUBLIC_API_BASE || 'https://towerimob.crmrebs.com'
const REBS_PUBLIC_API_KEY = process.env.REBS_PUBLIC_API_KEY || process.env.REBS_API_KEY

export const dynamic = 'force-dynamic'

// Old schema (for backward compatibility)
const requestBodySchemaOld = z.object({
  nume: z.string().min(1, 'Numele este obligatoriu'),
  prenume: z.string().min(1, 'Prenumele este obligatoriu'),
  telefon: z.string().optional(),
  tip_contact: z.string().optional(),
  email: z.string().email('Email invalid').optional(),
  tip_proprietate: z.string().optional(),
  camere_min: z.string().optional(),
  camere_max: z.string().optional(),
  buget_min: z.string().optional(),
  buget_max: z.string().optional(),
  comentarii_generale: z.string().optional(),
  agent_name: z.string().optional(),
  agentId: z.number().optional()
})

// New REBS public API schema (from documentation)
const requestBodySchemaNew = z.object({
  name: z.string().min(1, 'Numele este obligatoriu'),
  phone: z.string().min(1, 'Telefonul este obligatoriu'),
  email: z.string().email('Email invalid'),
  lead_source: z.string().optional(),
  lead_property: z.string().optional(),
  lead_residential_complex: z.string().optional(),
  external_id: z.string().optional(),
  message: z.string().optional()
})

const PROPERTY_TYPE_MAP: Record<string, number> = {
  'Apartament': 1,
  'Casă': 3,
  'Casă / Vilă': 3,
  'Vilă': 3,
  'Teren': 6,
  'Spațiu birouri': 4,
  'Spațiu comercial': 5,
  'Spațiu industrial': 7,
  'Hotel': 8,
  'Pensiune': 8,
  'Alt tip': 9,
}

const parseInteger = (value?: string | null) => {
  if (!value) return null
  const numeric = Number(value.toString().replace(/[^\d-]/g, ''))
  return Number.isFinite(numeric) ? numeric : null
}

const buildDetails = (payload: z.infer<typeof requestBodySchema>) => {
  const sections: string[] = []

  if (payload.agent_name) {
    sections.push(`Agent: ${payload.agent_name}`)
  }

  if (payload.tip_contact) {
    sections.push(`Canal contact: ${payload.tip_contact}`)
  }

  if (payload.tip_proprietate) {
    sections.push(`Tip proprietate: ${payload.tip_proprietate}`)
  }

  if (payload.camere_min || payload.camere_max) {
    sections.push(
      `Camere: ${payload.camere_min || '?'} - ${payload.camere_max || '?'}`
    )
  }

  if (payload.buget_min || payload.buget_max) {
    sections.push(
      `Buget: €${payload.buget_min || '?'} - €${payload.buget_max || '?'}`
    )
  }

  if (payload.comentarii_generale) {
    sections.push('')
    sections.push('Comentarii generale:')
    sections.push(payload.comentarii_generale.trim())
  }

  return sections.join('\n').trim()
}

const ensureRebsEnv = () => {
  if (!REBS_API_TOKEN) {
    throw new Error('REBS_API_TOKEN este necesar pentru integrarea CRM.')
  }
}

const rebsFetch = async (path: string, init?: RequestInit) => {
  ensureRebsEnv()
  const url = `${REBS_API_BASE}${path}`
  logger.log(`[REBS Private API] Fetching: ${url}`)
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
  
  try {
    const response = await fetch(url, {
    ...init,
      signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${REBS_API_TOKEN}`,
      ...(init?.headers ?? {}),
    },
  })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout after 30 seconds')
    }
    throw error
  }
}

const rebsPublicFetch = async (path: string, init?: RequestInit) => {
  if (!REBS_PUBLIC_API_KEY) {
    throw new Error('REBS_PUBLIC_API_KEY este necesar pentru API-ul public.')
  }
  
  const url = `${REBS_PUBLIC_API_BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${REBS_PUBLIC_API_KEY}`
  logger.log(`[REBS Public API] Fetching: ${url.replace(REBS_PUBLIC_API_KEY, '***')}`)
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
  
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })
    clearTimeout(timeoutId)
  return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout after 30 seconds')
    }
    throw error
  }
}

const findExistingContact = async (phone?: string | null, email?: string | null) => {
  const searchValue = phone?.trim() || email?.trim()
  if (!searchValue) return null

  const response = await rebsFetch(`/contacts/?search=${encodeURIComponent(searchValue)}`, { cache: 'no-store' })
  if (!response.ok) {
    return null
  }
  const payload = await response.json()
  const items: any[] = Array.isArray(payload) ? payload : payload?.results || payload?.objects || []
  return Array.isArray(items) && items.length > 0 ? items[0] : null
}

const createContact = async (
  data: { first_name: string; last_name: string; phone?: string; email?: string; agentId?: number }
) => {
  const contactPayload: Record<string, any> = {
    first_name: data.first_name,
    last_name: data.last_name,
  }

  if (data.phone?.trim()) {
    contactPayload.phone = data.phone.trim()
  }
  if (data.email?.trim()) {
    contactPayload.email = data.email.trim()
  }
  if (data.agentId) {
    contactPayload.agents = [data.agentId]
  }

  const response = await rebsFetch('/contacts/', {
    method: 'POST',
    body: JSON.stringify(contactPayload),
  })

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.detail || 'Nu am putut crea contactul în CRM.')
  }
  return payload
}

const upsertContact = async (
  firstName: string,
  lastName: string,
  phone?: string,
  email?: string,
  agentId?: number
) => {
  const existing = await findExistingContact(phone, email)
  if (existing?.id) {
    return existing
  }
  return createContact({ first_name: firstName, last_name: lastName, phone, email, agentId })
}

const buildRequestPayload = (
  parsed: z.infer<typeof requestBodySchema>,
  contactId: number
) => {
  const minRooms = parseInteger(parsed.camere_min)
  const maxRooms = parseInteger(parsed.camere_max)
  const minPrice = parseInteger(parsed.buget_min)
  const maxPrice = parseInteger(parsed.buget_max)
  const propertyType = parsed.tip_proprietate ? PROPERTY_TYPE_MAP[parsed.tip_proprietate] : undefined

  return {
    title: `${parsed.tip_proprietate || 'Cerere imobiliară'} - ${parsed.prenume} ${parsed.nume}`.trim(),
    agent: parsed.agentId ?? null,
    details: buildDetails(parsed),
    comments_general: parsed.comentarii_generale?.trim() || null,
    contact_ids: [contactId],
    lead_source_name: 'Dashboard Agent',
    property_type: propertyType ?? null,
    transaction_type: 2, // Cumpărare
    rooms_filter_gte: minRooms,
    rooms_filter_lte: maxRooms,
    price_filter_gte: minPrice,
    price_filter_lte: maxPrice,
    currency: 1, // EUR
    include_neighbouring_cities: true,
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  logger.log('=== [AddRequest API] Starting request ===')
  
  try {
    const rawBody = await request.json()
    logger.log('[AddRequest API] Received body:', JSON.stringify(rawBody, null, 2))
    
    // Try to parse with new schema first (REBS public API)
    let parsedNew: z.infer<typeof requestBodySchemaNew> | null = null
    let parsedOld: z.infer<typeof requestBodySchemaOld> | null = null
    let usePublicAPI = false
    
    try {
      parsedNew = requestBodySchemaNew.parse(rawBody)
      usePublicAPI = true
      logger.log('[AddRequest API] Using NEW schema (REBS public API)')
    } catch (newError) {
      logger.log('[AddRequest API] New schema failed, trying old schema')
      try {
        parsedOld = requestBodySchemaOld.parse(rawBody)
        logger.log('[AddRequest API] Using OLD schema (private API)')
      } catch (oldError) {
        logger.error('[AddRequest API] Both schemas failed')
        throw newError // Throw the new schema error as it's more relevant
      }
    }

    // Handle NEW schema (REBS public API)
    if (usePublicAPI && parsedNew) {
      logger.log('[AddRequest API] Processing with REBS public API')
      
      if (!parsedNew.name?.trim() || !parsedNew.phone?.trim() || !parsedNew.email?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Numele, telefonul și email-ul sunt obligatorii.',
          },
          { status: 400 }
        )
      }

      const payload: Record<string, any> = {
        name: parsedNew.name.trim(),
        phone: parsedNew.phone.trim(),
        email: parsedNew.email.trim(),
        lead_source: parsedNew.lead_source || 'Dashboard Agent',
      }

      if (parsedNew.message) {
        payload.message = parsedNew.message
      }
      if (parsedNew.lead_property) {
        payload.lead_property = parsedNew.lead_property
      }
      if (parsedNew.lead_residential_complex) {
        payload.lead_residential_complex = parsedNew.lead_residential_complex
      }
      if (parsedNew.external_id) {
        payload.external_id = parsedNew.external_id
      }

      logger.log('[AddRequest API] Public API payload:', JSON.stringify(payload, null, 2))

      const response = await rebsPublicFetch('/api/public/addrequest/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      logger.log('[AddRequest API] Public API response status:', response.status, response.statusText)

      const responseData = await response.json()
      logger.log('[AddRequest API] Public API response:', JSON.stringify(responseData, null, 2))

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            error: responseData?.error || 'Nu am putut înregistra cererea în CRM.',
          },
          { status: response.status }
        )
      }

      if (!responseData.success) {
        return NextResponse.json(
          {
            success: false,
            error: responseData?.error || 'Nu am putut înregistra cererea în CRM.',
          },
          { status: 400 }
        )
      }

      const elapsed = Date.now() - startTime
      logger.log(`[AddRequest API] Success in ${elapsed}ms`)

      return NextResponse.json({
        success: true,
        message: `Cererea pentru ${parsedNew.name} a fost înregistrată în CRM REBS.`,
        contact: responseData.contact,
        request: responseData.request,
      })
    }

    // Handle OLD schema (private API - backward compatibility)
    if (parsedOld) {
      logger.log('[AddRequest API] Processing with REBS private API (legacy)')
      
      if (!parsedOld.telefon?.trim() && !parsedOld.email?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Este necesar cel puțin un canal de contact (telefon sau email).',
        },
        { status: 400 }
      )
    }

      const fullName = `${parsedOld.prenume.trim()} ${parsedOld.nume.trim()}`
      const contact = await upsertContact(parsedOld.prenume.trim(), parsedOld.nume.trim(), parsedOld.telefon, parsedOld.email, parsedOld.agentId)

    if (!contact?.id) {
      throw new Error('Nu am putut obține ID-ul contactului din CRM.')
    }

      const requestPayload = buildRequestPayload(parsedOld, contact.id)
      logger.log('[AddRequest API] Private API payload:', JSON.stringify(requestPayload, null, 2))
      
    const response = await rebsFetch('/requests/', {
      method: 'POST',
      body: JSON.stringify(requestPayload),
    })

      logger.log('[AddRequest API] Private API response status:', response.status, response.statusText)

    const responseData = await response.json()
      logger.log('[AddRequest API] Private API response:', JSON.stringify(responseData, null, 2))
      
    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: responseData?.detail || 'Nu am putut înregistra cererea în CRM.',
        },
        { status: response.status }
      )
    }

    // Log lead event to database
    try {
        const minRooms = parseInteger(parsedOld.camere_min)
        const maxRooms = parseInteger(parsedOld.camere_max)
        const minPrice = parseInteger(parsedOld.buget_min)
        const maxPrice = parseInteger(parsedOld.buget_max)

      await db.insert(leadEvents).values({
        requestId: responseData?.id || null,
        contactId: contact.id,
          agentName: parsedOld.agent_name || 'Necunoscut',
          agentId: parsedOld.agentId || null,
        clientName: fullName,
          phone: parsedOld.telefon?.trim() || null,
          email: parsedOld.email?.trim() || null,
          tipProprietate: parsedOld.tip_proprietate || null,
        camereMin: minRooms,
        camereMax: maxRooms,
        bugetMin: minPrice ? minPrice : null,
        bugetMax: maxPrice ? maxPrice : null,
        eventTimestamp: new Date().toISOString(),
      })
    } catch (dbError) {
        logger.error('[AddRequest API] Failed to log lead event:', dbError)
    }

      const elapsed = Date.now() - startTime
      logger.log(`[AddRequest API] Success in ${elapsed}ms`)

    return NextResponse.json({
      success: true,
      message: `Cererea pentru ${fullName} a fost înregistrată în CRM REBS.`,
      request: responseData,
    })
    }

    throw new Error('Schema validation failed')
  } catch (error) {
    const elapsed = Date.now() - startTime
    logger.error(`[AddRequest API] Error after ${elapsed}ms:`, error)
    
    const message =
      error instanceof z.ZodError
        ? error.errors[0]?.message || 'Date invalide pentru cerere.'
        : error instanceof Error
          ? error.message
          : 'Eroare necunoscută la adăugarea cererii.'

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: error instanceof z.ZodError ? 400 : 500 }
    )
  }
}
