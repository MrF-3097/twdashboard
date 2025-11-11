'use client'

import useSWR from 'swr'
import { z } from 'zod'

// Property schema based on REBS API documentation - Made flexible to handle API variations
const propertySchema = z.object({
  id: z.number(),
  title: z.string().optional().nullable(), // Titlu Anunț
  name: z.string().optional().nullable(), // Fallback if title not available
  price_sale: z.number().optional().nullable(), // Preț vânzare
  price_rent: z.number().optional().nullable(), // Preț chirie/lună
  bedrooms: z.number().optional().nullable(), // Dormitoare
  bathrooms: z.number().optional().nullable(), // Nr. băi
  surface_total: z.number().optional().nullable(), // S. totală (mp)
  surface_useable: z.number().optional().nullable(), // S. utilă (mp) - suprafata utila
  availability: z.union([z.number(), z.string()]).optional().nullable(), // Valabilitate (1 = Activă) - can be number or string
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  zone: z.string().optional().nullable(), // Zonă
  street: z.string().optional().nullable(), // Stradă
  for_sale: z.boolean().optional().nullable(), // De vânzare
  for_rent: z.boolean().optional().nullable(), // De închiriat
  property_type: z.number().optional().nullable(), // Tip proprietate (1=Apartament, 3=Casă/Vilă, 6=Teren, 4=Spațiu birouri, 5=Spațiu comercial)
  agent: z.union([
    z.object({ id: z.number(), name: z.string().optional() }),
    z.number(),
    z.string(),
  ]).optional().nullable(), // Agent can be object with id, just id, or string
  resized_images: z.array(z.string()).optional().nullable(), // Imagini redimensionate (max 1920x1080)
  full_images: z.array(z.string()).optional().nullable(), // Imagini la dimensiunea originală
  thumbnail: z.string().optional().nullable(), // Thumbnail URL
}).passthrough() // Allow additional fields from API

const propertiesResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    objects: z.array(propertySchema),
    meta: z.object({
      total_count: z.number().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional().nullable(),
  }).passthrough(), // Allow additional fields
}).passthrough()

export type Property = z.infer<typeof propertySchema>
export type PropertiesResponse = z.infer<typeof propertiesResponseSchema>

const fetcher = async (url: string): Promise<PropertiesResponse> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch properties: ${response.status} ${response.statusText}`)
  }
  const data = await response.json()
  
  console.log('📥 [useProperties] Raw API response:', {
    success: data.success,
    objectsCount: data.data?.objects?.length || 0,
    hasMeta: !!data.data?.meta,
    sampleProperty: data.data?.objects?.[0],
  })
  
  try {
    const parsed = propertiesResponseSchema.parse(data)
    console.log('✅ [useProperties] Zod validation passed', {
      propertiesCount: parsed.data.objects.length,
    })
    return parsed
  } catch (error) {
    console.error('❌ [useProperties] Zod validation error:', error)
    if (error instanceof z.ZodError) {
      console.error('❌ [useProperties] Zod error details:', {
        issues: error.issues,
        firstIssue: error.issues[0],
      })
      // Log the problematic data
      console.error('❌ [useProperties] Problematic data:', {
        data: data,
        firstObject: data.data?.objects?.[0],
      })
    }
    // Return a safe fallback structure
    return {
      success: data.success || false,
      data: {
        objects: Array.isArray(data.data?.objects) ? data.data.objects : [],
        meta: data.data?.meta || { total_count: 0 },
      },
    } as PropertiesResponse
  }
}

export const useProperties = () => {
  const { data, error, isLoading, mutate } = useSWR<PropertiesResponse>(
    '/api/properties',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // Refresh every minute
    }
  )

  return {
    properties: data?.data?.objects || [],
    totalCount: data?.data?.meta?.total_count || 0,
    isLoading,
    isError: error,
    mutate,
  }
}

