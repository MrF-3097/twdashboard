import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { leadEvents } from '@/db/schema'

const REBS_API_BASE = process.env.REBS_PRIVATE_API_BASE || 'https://towerimob.crmrebs.com/api'
const REBS_API_TOKEN = process.env.REBS_API_TOKEN || process.env.REBS_WRITE_API_KEY || process.env.REBS_API_KEY

export const dynamic = 'force-dynamic'

const requestBodySchema = z.object({
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
  const response = await fetch(`${REBS_API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${REBS_API_TOKEN}`,
      ...(init?.headers ?? {}),
    },
  })
  return response
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
  try {
    const rawBody = await request.json()
    const parsed = requestBodySchema.parse(rawBody)
    if (!parsed.telefon?.trim() && !parsed.email?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Este necesar cel puțin un canal de contact (telefon sau email).',
        },
        { status: 400 }
      )
    }

    const fullName = `${parsed.prenume.trim()} ${parsed.nume.trim()}`
    const contact = await upsertContact(parsed.prenume.trim(), parsed.nume.trim(), parsed.telefon, parsed.email, parsed.agentId)

    if (!contact?.id) {
      throw new Error('Nu am putut obține ID-ul contactului din CRM.')
    }

    const requestPayload = buildRequestPayload(parsed, contact.id)
    const response = await rebsFetch('/requests/', {
      method: 'POST',
      body: JSON.stringify(requestPayload),
    })

    const responseData = await response.json()
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
      const minRooms = parseInteger(parsed.camere_min)
      const maxRooms = parseInteger(parsed.camere_max)
      const minPrice = parseInteger(parsed.buget_min)
      const maxPrice = parseInteger(parsed.buget_max)

      await db.insert(leadEvents).values({
        requestId: responseData?.id || null,
        contactId: contact.id,
        agentName: parsed.agent_name || 'Necunoscut',
        agentId: parsed.agentId || null,
        clientName: fullName,
        phone: parsed.telefon?.trim() || null,
        email: parsed.email?.trim() || null,
        tipProprietate: parsed.tip_proprietate || null,
        camereMin: minRooms,
        camereMax: maxRooms,
        bugetMin: minPrice ? minPrice : null,
        bugetMax: maxPrice ? maxPrice : null,
        eventTimestamp: new Date().toISOString(),
      })
    } catch (dbError) {
      // Log error but don't fail the request
      console.error('[AddRequest] Failed to log lead event:', dbError)
    }

    return NextResponse.json({
      success: true,
      message: `Cererea pentru ${fullName} a fost înregistrată în CRM REBS.`,
      request: responseData,
    })
  } catch (error) {
    console.error('[AddRequest] Error:', error)
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
