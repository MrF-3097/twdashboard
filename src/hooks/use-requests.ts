'use client'

import useSWR from 'swr'
import { z } from 'zod'

// Request schema based on REBS API documentation
const requestSchema = z.object({
  id: z.number(),
  display_id: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  agent: z.union([
    z.object({ id: z.number(), name: z.string().optional() }),
    z.number(),
    z.string(),
  ]).optional().nullable(),
  details: z.string().optional().nullable(),
  comments_general: z.string().optional().nullable(),
  contact_ids: z.array(z.number()).optional().nullable(),
  property_type: z.number().optional().nullable(),
  transaction_type: z.number().optional().nullable(), // 1 = Rent, 2 = Sale
  price_filter_gte: z.number().optional().nullable(),
  price_filter_lte: z.number().optional().nullable(),
  rooms_filter_gte: z.number().optional().nullable(),
  rooms_filter_lte: z.number().optional().nullable(),
  surface_useable_filter_gte: z.number().optional().nullable(),
  surface_useable_filter_lte: z.number().optional().nullable(),
  date_added: z.string().optional().nullable(),
  cities: z.array(z.string()).optional().nullable(),
  region_obj: z.number().optional().nullable(),
}).passthrough() // Allow additional fields from API

const requestsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    objects: z.array(requestSchema),
    meta: z.object({
      total_count: z.number().optional(),
      page: z.number().optional(),
      page_size: z.number().optional(),
      has_next: z.boolean().optional(),
      has_previous: z.boolean().optional(),
    }).optional().nullable(),
  }).passthrough(),
}).passthrough()

export type Request = z.infer<typeof requestSchema>
export type RequestsResponse = z.infer<typeof requestsResponseSchema>

const fetcher = async (url: string): Promise<RequestsResponse> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch requests: ${response.status} ${response.statusText}`)
  }
  const data = await response.json()
  
  console.log('📥 [useRequests] Raw API response:', {
    success: data.success,
    objectsCount: data.data?.objects?.length || 0,
    hasMeta: !!data.data?.meta,
    sampleRequest: data.data?.objects?.[0],
  })
  
  try {
    const parsed = requestsResponseSchema.parse(data)
    console.log('✅ [useRequests] Zod validation passed', {
      requestsCount: parsed.data.objects.length,
    })
    return parsed
  } catch (error) {
    console.error('❌ [useRequests] Zod validation error:', error)
    if (error instanceof z.ZodError) {
      console.error('❌ [useRequests] Zod error details:', {
        issues: error.issues,
        firstIssue: error.issues[0],
      })
      console.error('❌ [useRequests] Problematic data:', {
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
    } as RequestsResponse
  }
}

export const useRequests = () => {
  const { data, error, isLoading, mutate } = useSWR<RequestsResponse>(
    typeof window !== 'undefined' ? '/api/requests' : null,
    fetcher,
    {
      revalidateOnFocus: false, // Don't refetch on focus to use cache
      revalidateOnReconnect: true,
      refreshInterval: 120000, // Refresh every 2 minutes (API caches for 60s)
      dedupingInterval: 60000, // Dedupe requests within 60 seconds
      keepPreviousData: true, // Keep showing old data while fetching new
      errorRetryCount: 2,
      errorRetryInterval: 5000,
    }
  )

  return {
    requests: data?.data?.objects || [],
    totalCount: data?.data?.meta?.total_count || 0,
    isLoading,
    isError: error,
    mutate,
  }
}

