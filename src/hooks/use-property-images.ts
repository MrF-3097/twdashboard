'use client'

import useSWR from 'swr'
import { z } from 'zod'

// Image schema based on REBS API documentation
const propertyImageSchema = z.object({
  id: z.number(),
  url: z.string().url(),
  order: z.number().optional().nullable(),
  is_sketch: z.boolean().optional().nullable(),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
}).passthrough()

const propertyImagesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(propertyImageSchema),
  propertyId: z.number(),
  count: z.number().optional(),
}).passthrough()

export type PropertyImage = z.infer<typeof propertyImageSchema>
export type PropertyImagesResponse = z.infer<typeof propertyImagesResponseSchema>

const fetcher = async (url: string): Promise<PropertyImagesResponse> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch property images: ${response.status} ${response.statusText}`)
  }
  const data = await response.json()
  
  try {
    return propertyImagesResponseSchema.parse(data)
  } catch (error) {
    console.error('❌ [usePropertyImages] Validation error:', error)
    // Return safe fallback
    return {
      success: data.success || false,
      data: Array.isArray(data.data) ? data.data : [],
      propertyId: data.propertyId || 0,
      count: data.count || 0,
    } as PropertyImagesResponse
  }
}

/**
 * Hook to fetch images for a specific property
 * @param propertyId - The ID of the property
 * @param enabled - Whether to fetch images (default: true)
 */
export const usePropertyImages = (propertyId: number | string | null | undefined, enabled: boolean = true) => {
  const { data, error, isLoading, mutate } = useSWR<PropertyImagesResponse>(
    enabled && propertyId ? `/api/rebs/property-images/${propertyId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0, // Don't auto-refresh images
    }
  )

  return {
    images: data?.data || [],
    isLoading,
    isError: error,
    mutate,
    firstImage: data?.data?.[0]?.url || null,
  }
}


