import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import path from 'path'
import { promises as fs } from 'fs'
import OpenAI from 'openai'
import { ensureRebsEnv, rebsFetch } from '@/lib/rebs-client'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const openai =
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null

// Log OpenAI initialization status
if (openai) {
  logger.info('[Property API] OpenAI client initialized successfully', {
    hasApiKey: !!process.env.OPENAI_API_KEY,
    apiKeyLength: process.env.OPENAI_API_KEY?.length || 0
  })
} else {
  logger.warn('[Property API] OpenAI client NOT initialized - API key missing or empty', {
    hasApiKey: !!process.env.OPENAI_API_KEY,
    apiKeyLength: process.env.OPENAI_API_KEY?.length || 0
  })
}

const contactSchema = z.object({
  firstName: z.string().min(1, 'Prenumele este obligatoriu'),
  lastName: z.string().min(1, 'Numele este obligatoriu'),
  cnp: z.string().min(5, 'CNP invalid'),
  address: z.string().optional().default(''),
  phone: z.string().optional(),
  phoneExpiry: z.string().optional(),
  email: z.string().email().optional(),
  allowAgentEmail: z.boolean().optional().default(false),
  notes: z.string().optional().default('')
})

const associateSchema = contactSchema.pick({ firstName: true, lastName: true, cnp: true }).extend({
  phone: z.string().optional(),
  email: z.string().optional()
})

const fileSummarySchema = z.object({
  name: z.string(),
  size: z.number()
})

const fabPropertySchema = z.object({
  agentName: z.string().optional(),
  agentId: z.number().optional(),
  contact: contactSchema,
  mandatarList: z.array(associateSchema).optional().default([]),
  coproprietarList: z.array(associateSchema).optional().default([]),
  requiresInternalDoc: z.boolean().optional().default(false),
  property: z.object({
    propertyType: z.string().min(1, 'Tipul proprietății este obligatoriu'),
    cfNumber: z.string().optional().default(''),
    cfScan: fileSummarySchema.optional(),
    transactionMode: z.enum(['sale', 'rent', 'both']),
    representationType: z
      .enum(['Exclusivitate', 'Intermediere Exclusiva', 'Intermediere'])
      .default('Intermediere'),
    location: z.object({
      street: z.string().optional().default(''),
      streetNumber: z.string().optional().default(''),
      city: z.string().optional().default(''),
      county: z.string().optional().default(''),
      unit: z.string().optional().default(''),
      lat: z.string().optional().default(''),
      lng: z.string().optional().default(''),
      duplicateWarning: z.string().optional()
    }),
    meta: z.object({
      apartmentType: z.string().optional().default(''),
      houseType: z.string().optional().default(''),
      commercialBuildingType: z.string().optional().default(''),
      hotelType: z.string().optional().default(''),
      specialPropertyType: z.string().optional().default('')
    }),
    areas: z.object({
      surfaceBuilt: z.string().optional().default(''),
      surfaceTerrace: z.string().optional().default(''),
      surfaceBalconies: z.string().optional().default(''),
      surfaceLand: z.string().optional().default(''),
      surfaceYard: z.string().optional().default(''),
      surfaceYardFree: z.string().optional().default(''),
      surfaceTotal: z.string().optional().default(''),
      surfaceUnit: z.string().optional().default('')
    }),
    counts: z.object({
      kitchens: z.string().optional().default(''),
      lockers: z.string().optional().default(''),
      lifts: z.string().optional().default(''),
      buildingUndergroundFloors: z.string().optional().default(''),
      buildingRetiredFloors: z.string().optional().default('')
    }),
    construction: z.object({
      newBuildingDeveloper: z.boolean().optional().default(false),
      newBuildingResale: z.boolean().optional().default(false)
    }),
    characteristics: z.object({
      hasBathroomWindow: z.boolean().optional().default(false),
      bathrooms: z.string().optional().default(''),
      rooms: z.string().optional().default(''),
      bedrooms: z.string().optional().default(''),
      surfaceUseable: z.string().optional().default(''),
      floor: z.string().optional().default(''),
      comfort: z.string().optional().default(''),
      balconies: z.string().optional().default(''),
      terraces: z.string().optional().default(''),
      garages: z.string().optional().default(''),
      parkingSpots: z.string().optional().default(''),
      buildingFloors: z.string().optional().default(''),
      newBuilding: z.boolean().optional().default(false),
      flags: z.array(z.string()).optional().default([]),
      straziAmenajate: z.array(z.string()).optional().default([]),
      straziNeamenajate: z.array(z.string()).optional().default([]),
      utilities: z.array(z.string()).optional().default([]),
      dotariImobil: z.array(z.string()).optional().default([]),
      parking: z.array(z.string()).optional().default([]),
      heating: z.array(z.string()).optional().default([]),
      views: z.array(z.string()).optional().default([]),
      doors: z.array(z.string()).optional().default([]),
      floors: z.array(z.string()).optional().default([]),
      windows: z.array(z.string()).optional().default([]),
      metering: z.array(z.string()).optional().default([]),
      kitchen: z.array(z.string()).optional().default([]),
      otherSpaces: z.array(z.string()).optional().default([])
    }),
    pricing: z.object({
      salePrice: z.string().optional().default(''),
      rentPrice: z.string().optional().default(''),
      pricePerSqmSale: z.string().optional().default(''),
      pricePerSqmRent: z.string().optional().default(''),
      vat: z.string().optional().default(''),
      negotiable: z.boolean().optional().default(false),
      currency: z.enum(['EUR', 'RON']).default('EUR'),
      commissionPercent: z.string().optional().default(''),
      commissionMessage: z.string().optional().default('')
    }),
    media: z.object({
      photos: z.array(fileSummarySchema).optional().default([]),
      videoUrl: z.string().optional().default(''),
      virtualTourUrl: z.string().optional().default(''),
      notes: z.string().optional().default('')
    }),
    rentalExtras: z.object({
      acceptsPets: z.boolean().optional().default(false),
      deposit: z.string().optional().default(''),
      advance: z.string().optional().default(''),
      maintenance: z.string().optional().default(''),
      hasTenant: z.boolean().optional().default(false),
      tenantUntil: z.string().optional().default(''),
      rentCollected: z.string().optional().default(''),
      hasKeys: z.boolean().optional().default(false),
      videoViewing: z.boolean().optional().default(false)
    })
  }),
  warnings: z.array(z.string()).optional().default([])
})

const draftsPath = path.join(process.cwd(), 'data', 'fab-property-drafts.json')

const propertyTypeMap: Record<string, number> = {
  Apartament: 1,
  'Casă': 3,
  'Casă / Vilă': 3,
  Vilă: 3,
  Teren: 6,
  'Spațiu comercial': 5,
  'Spațiu industrial': 7,
  'Spațiu de birouri': 4,
  Hotel: 8,
  Pensiune: 8,
  Altele: 9,
}

const currencyMap: Record<'EUR' | 'RON', number> = {
  EUR: 1,
  RON: 2
}

type FabCharacteristics = z.infer<typeof fabPropertySchema>['property']['characteristics']

const floorKeywordMap: Record<string, number> = {
  demisol: 1,
  subsol: 1,
  parter: 2,
  p: 2,
  mezanin: 102,
  mansarda: 100,
  mansardă: 100,
  mansard: 100,
  'ultimul etaj': 101,
  'ultimele 2 etaje': 101
}

async function readDrafts() {
  try {
    const raw = await fs.readFile(draftsPath, 'utf-8')
    return JSON.parse(raw)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
}

async function writeDraft(record: unknown) {
  const drafts = await readDrafts()
  drafts.push(record)
  await fs.writeFile(draftsPath, JSON.stringify(drafts, null, 2))
}

function parseNumeric(value?: string): number | undefined {
  if (!value) return undefined
  const normalized = value.replace(/[^0-9.,-]/g, '').replace(',', '.')
  const num = Number(normalized)
  return Number.isFinite(num) ? num : undefined
}

function parseInteger(value?: string): number | undefined {
  if (!value) return undefined
  const match = value.match(/-?\d+/)
  if (!match) return undefined
  const num = Number(match[0])
  return Number.isFinite(num) ? num : undefined
}

const normalizeValue = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const hasKeyword = (values: string[] = [], keywords: string[]): boolean => {
  if (!values.length) return false
  const normalized = new Set(values.map(normalizeValue))
  return keywords.some((needle) => normalized.has(normalizeValue(needle)))
}

const mapVatSaleValue = (vat?: string) => {
  if (!vat || vat === 'nu') return 1
  return 4
}

const mapVatRentValue = (vat?: string) => {
  if (!vat || vat === 'nu') return 1
  return 3
}

const buildFeatureFlags = (characteristics: FabCharacteristics) => {
  const normalizedFlags = [
    ...(characteristics.flags || []),
    ...(characteristics.otherSpaces || []),
  ]
  const kitchenOptions = characteristics.kitchen || []

  return {
    hasOpenKitchen: hasKeyword(kitchenOptions, ['Bucătărie deschisă']),
    hasClosedKitchen: hasKeyword(kitchenOptions, ['Bucătărie închisă']),
    hasBasement:
      hasKeyword(normalizedFlags, ['Pivniță', 'Pivnita']) || hasKeyword(normalizedFlags, ['Subsol']),
    hasSemiBasement: hasKeyword(normalizedFlags, ['Demisol']),
    hasMansard: hasKeyword(normalizedFlags, ['Mansardă', 'Mansarda']),
    hasTechnicalFloor: hasKeyword(normalizedFlags, ['Etaj tehnic']),
    hasAttic: hasKeyword(normalizedFlags, ['Pod']),
  }
}

const formatCurrency = (value?: number, currency: 'EUR' | 'RON' = 'EUR') => {
  if (!value || !Number.isFinite(value)) return null
  try {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${value} ${currency === 'RON' ? 'RON' : '€'}`
  }
}

const buildPropertyTitle = (parsed: z.infer<typeof fabPropertySchema>) => {
  logger.debug('[Property API] Building property title', {
    propertyType: parsed.property.propertyType,
    transactionMode: parsed.property.transactionMode,
    rooms: parsed.property.characteristics.rooms,
    salePrice: parsed.property.pricing.salePrice,
    rentPrice: parsed.property.pricing.rentPrice,
    currency: parsed.property.pricing.currency
  })

  const mode = parsed.property.transactionMode
  const forSale = mode === 'sale' || mode === 'both'
  const forRent = mode === 'rent' || mode === 'both'
  const modeLabel =
    forSale && forRent ? 'de vânzare & de închiriat' : forSale ? 'de vânzare' : 'de închiriat'

  const roomsValue = parseInteger(parsed.property.characteristics.rooms)
  const roomsLabel = roomsValue ? `${roomsValue} camere` : ''

  const salePrice = parseNumeric(parsed.property.pricing.salePrice)
  const rentPrice = parseNumeric(parsed.property.pricing.rentPrice)
  const priceLabel =
    (forSale && salePrice && formatCurrency(salePrice, parsed.property.pricing.currency)) ||
    (forRent && rentPrice && formatCurrency(rentPrice, parsed.property.pricing.currency)) ||
    ''

  const titleParts = [
    parsed.property.propertyType,
    modeLabel,
    roomsLabel && `${roomsLabel}`,
    priceLabel && `| ${priceLabel}`,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  logger.info('[Property API] Generated property title', {
    title: titleParts,
    parts: {
      propertyType: parsed.property.propertyType,
      modeLabel,
      roomsLabel,
      priceLabel
    }
  })

  return titleParts
}

const buildDescriptionSummary = (parsed: z.infer<typeof fabPropertySchema>) => {
  const locationParts = [parsed.property.location.city, parsed.property.location.street]
    .filter(Boolean)
    .join(', ')
  const priceSummary = [
    parseNumeric(parsed.property.pricing.salePrice) &&
      `Preț vânzare: ${formatCurrency(
        parseNumeric(parsed.property.pricing.salePrice),
        parsed.property.pricing.currency
      )}`,
    parseNumeric(parsed.property.pricing.rentPrice) &&
      `Preț închiriere: ${formatCurrency(
        parseNumeric(parsed.property.pricing.rentPrice),
        parsed.property.pricing.currency
      )}/lună`,
  ]
    .filter(Boolean)
    .join(' | ')

  const features = [
    parsed.property.characteristics.rooms && `${parsed.property.characteristics.rooms} camere`,
    parsed.property.characteristics.bathrooms &&
      `${parsed.property.characteristics.bathrooms} băi`,
    parsed.property.characteristics.surfaceUseable &&
      `${parsed.property.characteristics.surfaceUseable} mp utili`,
    parsed.property.characteristics.floor && `Etaj: ${parsed.property.characteristics.floor}`,
  ]
    .filter(Boolean)
    .join(', ')

  const amenities = [
    ...(parsed.property.characteristics.utilities || []),
    ...(parsed.property.characteristics.dotariImobil || []),
    ...(parsed.property.characteristics.parking || []),
    ...(parsed.property.characteristics.otherSpaces || []),
  ].join(', ')

  return [
    `Tip proprietate: ${parsed.property.propertyType}`,
    `Transacție: ${parsed.property.transactionMode}`,
    locationParts && `Localizare: ${locationParts}`,
    features && `Caracteristici: ${features}`,
    parsed.property.characteristics.flags.length > 0 &&
      `Notă: ${parsed.property.characteristics.flags.join(', ')}`,
    priceSummary,
    amenities && `Dotări: ${amenities}`,
  ]
    .filter(Boolean)
    .join('\n')
}

const fallbackDescription = (summary: string) =>
  `Tower Imob prezintă o proprietate configurată astfel:\n${summary}\nPentru detalii suplimentare și vizionări, contactează echipa noastră.`

const generateDescription = async (parsed: z.infer<typeof fabPropertySchema>) => {
  logger.info('[Property API] Starting description generation')
  
  const summary = buildDescriptionSummary(parsed)
  logger.debug('[Property API] Description summary built', {
    summaryLength: summary.length,
    summaryPreview: summary.substring(0, 200)
  })

  if (!openai) {
    logger.warn('[Property API] OpenAI client not available, using fallback description')
    const fallback = fallbackDescription(summary)
    logger.info('[Property API] Using fallback description', {
      descriptionLength: fallback.length
    })
    return fallback
  }

  try {
    logger.info('[Property API] Calling OpenAI API for description generation', {
      model: 'gpt-4o-mini',
      summaryLength: summary.length
    })

    const startTime = Date.now()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Ești copywriter pentru Tower Imob. Scrie descrieri concise, profesioniste și atrăgătoare, în limba română, max 160 de cuvinte. Include avantajele principale și îndeamnă clientul să programeze o vizionare.',
        },
        {
          role: 'user',
          content: `Folosește următoarele date despre proprietate pentru a scrie descrierea:\n${summary}`,
        },
      ],
      max_tokens: 400,
      temperature: 0.6,
    })

    const duration = Date.now() - startTime
    logger.info('[Property API] OpenAI API call completed', {
      duration: `${duration}ms`,
      usage: completion.usage,
      choicesCount: completion.choices?.length || 0
    })

    const text = completion.choices[0]?.message?.content?.trim()
    
    if (!text || text.length === 0) {
      logger.warn('[Property API] OpenAI returned empty description, using fallback', {
        completion: JSON.stringify(completion, null, 2)
      })
      return fallbackDescription(summary)
    }

    logger.info('[Property API] Successfully generated AI description', {
      descriptionLength: text.length,
      descriptionPreview: text.substring(0, 150)
    })

    return text
  } catch (error) {
    logger.error('[Property API] OpenAI API call failed', error)
    
    // Log detailed error information
    if (error instanceof Error) {
      logger.error('[Property API] OpenAI error details', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
    } else if (typeof error === 'object' && error !== null) {
      logger.error('[Property API] OpenAI error object', error)
    }

    return fallbackDescription(summary)
  }
}

function normaliseId(entity: any): number | null {
  if (entity?.id && Number.isFinite(entity.id)) {
    return Number(entity.id)
  }
  if (entity?.resource_uri) {
    const match = entity.resource_uri.match(/\/(\\d+)\/?$/)
    if (match) {
      return Number(match[1])
    }
  }
  return null
}

async function parseJsonSafe(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function searchContact(contact: z.infer<typeof contactSchema>) {
  const searchableValues = [contact.phone, contact.cnp, `${contact.firstName} ${contact.lastName}`]
    .filter(Boolean)
    .map((value) => value!.trim())
  for (const value of searchableValues) {
    if (!value) continue
    const res = await rebsFetch(`/contacts/?search=${encodeURIComponent(value)}`, {
      method: 'GET',
      cache: 'no-store'
    })
    if (!res.ok) {
      continue
    }
    const data = await parseJsonSafe(res)
    const candidates: any[] =
      Array.isArray(data) ? data : data?.results || data?.objects || data?.items || []
    if (Array.isArray(candidates) && candidates.length > 0) {
      return candidates[0]
    }
  }
  return null
}

async function createContact(contact: z.infer<typeof contactSchema>) {
  const payload = {
    first_name: contact.firstName,
    last_name: contact.lastName,
    phone: contact.phone,
    email: contact.email,
    address: contact.address,
    cnp: contact.cnp,
    notes: contact.notes || undefined
  }

  const response = await rebsFetch('/contacts/', {
    method: 'POST',
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const body = await parseJsonSafe(response)
    throw new Error(body?.detail || body?.error || 'Nu am putut crea contactul în CRM REBS.')
  }

  return await parseJsonSafe(response)
}

async function upsertContact(contact: z.infer<typeof contactSchema>) {
  const existing = await searchContact(contact)
  if (existing) {
    return existing
  }
  return createContact(contact)
}

function mapRepresentation(representation: string, mode: 'sale' | 'rent' | 'both') {
  const isSale = mode === 'sale' || mode === 'both'
  const isRent = mode === 'rent' || mode === 'both'
  return {
    exclusive_sale: representation !== 'Intermediere' && isSale,
    exclusive_rent: representation !== 'Intermediere' && isRent,
    exclusive_representation_sale: representation === 'Intermediere Exclusiva' && isSale,
    exclusive_representation_rent: representation === 'Intermediere Exclusiva' && isRent
  }
}

function mapFloorValue(value?: string): number | undefined {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (!normalized) return undefined
  if (floorKeywordMap[normalized]) {
    return floorKeywordMap[normalized]
  }
  if (normalized.includes('demisol') || normalized.includes('subsol')) {
    return 1
  }
  if (normalized.includes('parter') || normalized === 'p') {
    return 2
  }
  if (normalized.includes('mezanin')) {
    return 102
  }
  if (normalized.includes('mansard')) {
    return 100
  }
  if (normalized.includes('ultim')) {
    return 101
  }
  const numeric = parseInteger(normalized)
  if (numeric === undefined) {
    return undefined
  }
  if (numeric < 0) {
    return 1
  }
  if (numeric === 0) {
    return 2
  }
  return numeric + 2
}

function mapComfortValue(value?: string): number | undefined {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (!normalized) return undefined
  if (normalized.includes('lux')) {
    return 4
  }
  const numeric = parseInteger(normalized)
  if (!numeric) {
    return undefined
  }
  if (numeric >= 1 && numeric <= 4) {
    return numeric
  }
  return undefined
}

function mapPropertyPayload(
  parsed: z.infer<typeof fabPropertySchema>,
  contactIds: number[],
  description: string | undefined,
  title: string
): Record<string, unknown> {
  const mode = parsed.property.transactionMode
  const forSale = mode === 'sale' || mode === 'both'
  const forRent = mode === 'rent' || mode === 'both'

  const representationFlags = mapRepresentation(parsed.property.representationType, mode)
  const floorCode = mapFloorValue(parsed.property.characteristics.floor)
  const comfortCode = mapComfortValue(parsed.property.characteristics.comfort)
  const streetNumber = parseInteger(parsed.property.location.streetNumber)
  const meta = parsed.property.meta
  const areas = parsed.property.areas
  const counts = parsed.property.counts
  const construction = parsed.property.construction
  const featureFlags = buildFeatureFlags(parsed.property.characteristics)
  const vatValue = parsed.property.pricing.vat

  return {
    title: title || `${parsed.property.propertyType} - ${parsed.contact.lastName}`.trim(),
    description,
    agent: parsed.agentId ?? null,
    property_type: propertyTypeMap[parsed.property.propertyType] ?? 9,
    apartment_type: parseInteger(meta.apartmentType),
    house_type: parseInteger(meta.houseType),
    commercial_building_type: parseInteger(meta.commercialBuildingType),
    hotel_type: parseInteger(meta.hotelType),
    special_property_type: parseInteger(meta.specialPropertyType),
    for_sale: forSale,
    for_rent: forRent,
    availability: 5,
    contact_ids: contactIds,
    street: parsed.property.location.street,
    street_number: streetNumber,
    location_number: parsed.property.location.streetNumber || undefined,
    location_unit: parsed.property.location.unit || undefined,
    city_obj: undefined,
    region_obj: undefined,
    lat: parsed.property.location.lat ? Number(parsed.property.location.lat) : undefined,
    lng: parsed.property.location.lng ? Number(parsed.property.location.lng) : undefined,
    has_bathroom_window: parsed.property.characteristics.hasBathroomWindow,
    has_open_kitchen: featureFlags.hasOpenKitchen,
    has_closed_kitchen: featureFlags.hasClosedKitchen,
    has_basement: featureFlags.hasBasement,
    has_semibasement: featureFlags.hasSemiBasement,
    has_mansard: featureFlags.hasMansard,
    has_technical_floor: featureFlags.hasTechnicalFloor,
    has_attic: featureFlags.hasAttic,
    rooms: parseNumeric(parsed.property.characteristics.rooms),
    bathrooms: parseNumeric(parsed.property.characteristics.bathrooms),
    bedrooms: parseNumeric(parsed.property.characteristics.bedrooms),
    surface_useable: parseNumeric(parsed.property.characteristics.surfaceUseable),
    surface_built: parseNumeric(areas.surfaceBuilt),
    surface_terrace: parseNumeric(areas.surfaceTerrace),
    surface_balconies: parseNumeric(areas.surfaceBalconies),
    surface_land: parseNumeric(areas.surfaceLand),
    surface_yard: parseNumeric(areas.surfaceYard),
    surface_yard_free: parseNumeric(areas.surfaceYardFree),
    surface_total: parseNumeric(areas.surfaceTotal),
    surface_unit: parseInteger(areas.surfaceUnit),
    floor: floorCode,
    floor_multi: floorCode ? [floorCode] : undefined,
    comfort: comfortCode,
    balconies: parseNumeric(parsed.property.characteristics.balconies),
    terraces: parseNumeric(parsed.property.characteristics.terraces),
    garages: parseNumeric(parsed.property.characteristics.garages),
    parking_spots: parseNumeric(parsed.property.characteristics.parkingSpots),
    building_floors: parseNumeric(parsed.property.characteristics.buildingFloors),
    new_building: parsed.property.characteristics.newBuilding,
    new_building_developer: construction.newBuildingDeveloper,
    new_building_resale: construction.newBuildingResale,
    kitchens: parseNumeric(counts.kitchens),
    lockers: parseNumeric(counts.lockers),
    lifts: parseNumeric(counts.lifts),
    building_underground_floors: parseNumeric(counts.buildingUndergroundFloors),
    building_retired_floors: parseNumeric(counts.buildingRetiredFloors),
    price_sale: parseNumeric(parsed.property.pricing.salePrice),
    price_rent: parseNumeric(parsed.property.pricing.rentPrice),
    price_sqm_sale: parseNumeric(parsed.property.pricing.pricePerSqmSale),
    price_sqm_rent: parseNumeric(parsed.property.pricing.pricePerSqmRent),
    currency_sale: forSale ? currencyMap[parsed.property.pricing.currency] : undefined,
    currency_rent: forRent ? currencyMap[parsed.property.pricing.currency] : undefined,
    negotiable_sale_price: parsed.property.pricing.negotiable && forSale,
    negotiable_rent_price: parsed.property.pricing.negotiable && forRent,
    vat_sale: forSale ? mapVatSaleValue(vatValue) : undefined,
    vat_rent: forRent ? mapVatRentValue(vatValue) : undefined,
    collaboration_commission_percent_sale: forSale
      ? parseNumeric(parsed.property.pricing.commissionPercent)
      : undefined,
    collaboration_commission_percent_rent: forRent
      ? parseNumeric(parsed.property.pricing.commissionPercent)
      : undefined,
    collab_commission_choice_sale: forSale ? 3 : undefined,
    collab_commission_choice_rent: forRent ? 3 : undefined,
    video_link: parsed.property.media.videoUrl || undefined,
    virtual_tour_link: parsed.property.media.virtualTourUrl || undefined,
    pet_friendly: parsed.property.rentalExtras.acceptsPets,
    guarantee_cost: parseNumeric(parsed.property.rentalExtras.deposit),
    upfront_cost: parseNumeric(parsed.property.rentalExtras.advance),
    maintenance_cost: parseNumeric(parsed.property.rentalExtras.maintenance),
    date_available: parsed.property.rentalExtras.hasTenant
      ? parsed.property.rentalExtras.tenantUntil || undefined
      : undefined,
    rented_until: parsed.property.rentalExtras.tenantUntil || undefined,
    ...representationFlags,
  }
}

function filterFileList(entry: FormDataEntryValue | null): File | null {
  if (entry instanceof File && entry.size > 0) {
    return entry
  }
  return null
}

async function uploadPropertyFile(propertyId: number, file: File, extras?: { isSketch?: boolean }) {
  const buffer = Buffer.from(await file.arrayBuffer())
  const blob = new Blob([buffer], { type: file.type || 'application/octet-stream' })
  const formData = new FormData()
  formData.append('image', blob, file.name || 'upload.jpg')
  if (extras?.isSketch) {
    formData.append('is_sketch', 'true')
  }

  const response = await rebsFetch(`/properties/${propertyId}/images/`, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const body = await parseJsonSafe(response)
    const message =
      body?.detail || body?.error || `Nu am putut încărca fișierul ${file.name || ''}`.trim()
    const error = new Error(message)
    ;(error as any).status = response.status
    throw error
  }
}

async function searchDuplicateProperty(parsed: z.infer<typeof fabPropertySchema>) {
  const params = new URLSearchParams()
  if (parsed.property.cfNumber) {
    params.set('cf_number', parsed.property.cfNumber)
  } else if (parsed.property.location.street) {
    params.set('street', parsed.property.location.street)
    if (parsed.property.location.streetNumber) {
      params.set('street_number', parsed.property.location.streetNumber)
    }
  }

  if (Array.from(params.keys()).length === 0) {
    return null
  }

  const res = await rebsFetch(`/properties/?${params.toString()}`, { cache: 'no-store' })
  if (!res.ok) {
    return null
  }
  const payload = await parseJsonSafe(res)
  const items: any[] = Array.isArray(payload) ? payload : payload?.results || payload?.objects || []
  return Array.isArray(items) && items.length > 0 ? items[0] : null
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const payloadRaw = formData.get('payload')
    if (!payloadRaw || typeof payloadRaw !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Payload invalid (lipsește corpul JSON).' },
        { status: 400 }
      )
    }

    const parsedJson = JSON.parse(payloadRaw)
    const parsed = fabPropertySchema.parse(parsedJson)

    const cfFile = filterFileList(formData.get('cf_scan'))
    const photoUploads = formData
      .getAll('photos')
      .map((entry) => (entry instanceof File && entry.size > 0 ? entry : null))
      .filter((entry): entry is File => Boolean(entry))

    ensureRebsEnv()

    const owner = await upsertContact(parsed.contact)
    const mandatarContacts = await Promise.all(
      parsed.mandatarList.map((person) =>
        upsertContact({
          ...person,
          address: parsed.contact.address,
          allowAgentEmail: false,
          notes: ''
        })
      )
    )
    const coproprietarContacts = await Promise.all(
      parsed.coproprietarList.map((person) =>
        upsertContact({
          ...person,
          address: parsed.contact.address,
          allowAgentEmail: false,
          notes: ''
        })
      )
    )

    const allContacts = [owner, ...mandatarContacts, ...coproprietarContacts]
    const contactIds = Array.from(
      new Set(
        allContacts
          .map((contact) => normaliseId(contact))
          .filter((id): id is number => typeof id === 'number')
      )
    )

    const warnings: string[] = []
    const duplicate = await searchDuplicateProperty(parsed)
    if (duplicate) {
      warnings.push(
        'O proprietate cu date similare există deja în CRM. Verifică lista înainte de a continua.'
      )
    }

    logger.info('[Property API] Generating title and description for property')
    
    const propertyTitle = buildPropertyTitle(parsed)
    logger.info('[Property API] Property title generated', { title: propertyTitle })
    
    const aiDescription = await generateDescription(parsed)
    logger.info('[Property API] AI description generated', {
      descriptionLength: aiDescription.length,
      hasMediaNotes: !!parsed.property.media.notes
    })
    
    const finalDescription = [aiDescription, parsed.property.media.notes?.trim()]
      .filter(Boolean)
      .join('\n\n')
      .trim()
    
    logger.info('[Property API] Final description prepared', {
      finalDescriptionLength: finalDescription.length,
      includesMediaNotes: finalDescription.includes(parsed.property.media.notes || '')
    })
    
    const propertyPayload = mapPropertyPayload(parsed, contactIds, finalDescription || undefined, propertyTitle)
    
    logger.info('[Property API] Property payload prepared', {
      hasTitle: !!propertyPayload.title,
      title: propertyPayload.title,
      hasDescription: !!propertyPayload.description,
      descriptionLength: propertyPayload.description?.length || 0,
      descriptionPreview: propertyPayload.description?.substring(0, 100)
    })
    const propertyResponse = await rebsFetch('/properties/', {
      method: 'POST',
      body: JSON.stringify(propertyPayload)
    })
    const propertyBodyText = await propertyResponse.text()

    if (!propertyResponse.ok) {
      console.error('[REBS property error]', propertyResponse.status, propertyBodyText)
      let errorBody: any = null
      try {
        errorBody = JSON.parse(propertyBodyText)
      } catch {
        errorBody = null
      }
      throw new Error(errorBody?.detail || errorBody?.error || 'Nu am putut crea proprietatea în CRM REBS.')
    }

    const propertyBody = propertyBodyText ? JSON.parse(propertyBodyText) : null
    const propertyId = normaliseId(propertyBody)

    if (propertyId && (cfFile || photoUploads.length > 0)) {
      if (cfFile) {
        try {
await uploadPropertyFile(propertyId, cfFile, { isSketch: true })
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Nu am putut încărca documentul CF.'
          warnings.push(
            `Scanarea CF nu a putut fi încărcată automat (va trebui adăugată manual în REBS). Motiv: ${message}`
          )
        }
      }
      if (photoUploads.length > 0) {
        for (const file of photoUploads) {
          try {
            await uploadPropertyFile(propertyId, file)
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Nu am putut încărca o fotografie.'
            warnings.push(
              `Fotografia "${file.name}" nu a putut fi încărcată automat (încarcă manual în CRM). Motiv: ${message}`
            )
          }
        }
      }
    }

    await writeDraft({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      payload: parsed,
      propertyId
    })

    return NextResponse.json({
      success: true,
      message: 'Proprietatea a fost înregistrată în CRM REBS.',
      propertyId,
      contactIds,
      warnings
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payload invalid',
          issues: error.flatten()
        },
        { status: 400 }
      )
    }

    const message = error instanceof Error ? error.message : 'A apărut o eroare neașteptată'
    return NextResponse.json(
      {
        success: false,
        error: message
      },
      { status: 500 }
    )
  }
}
