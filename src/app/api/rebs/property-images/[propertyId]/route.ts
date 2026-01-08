import { NextRequest, NextResponse } from 'next/server'
import { rebsFetch } from '@/lib/rebs-client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/rebs/property-images/[propertyId]
 * 
 * Fetches all images for a specific property from REBS API.
 * Returns a list of image objects with URL, dimensions, and metadata.
 * Only public images are included in the response.
 * 
 * Response Format:
 * [
 *   {
 *     "id": 123,
 *     "url": "https://example.com/media/image.jpg",
 *     "order": 1,
 *     "is_sketch": false,
 *     "width": 1920,
 *     "height": 1080
 *   }
 * ]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const propertyId = params.propertyId

    if (!propertyId || isNaN(Number(propertyId))) {
      return NextResponse.json(
        { success: false, error: 'Invalid property ID' },
        { status: 400 }
      )
    }

    console.log(`📸 Fetching images for property ${propertyId}`)

    const response = await rebsFetch(`/properties/${propertyId}/images/`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      const body = await response.text()
      // If property has no images, return empty array instead of error
      if (response.status === 404) {
        console.log(`ℹ️ No images found for property ${propertyId}`)
        return NextResponse.json({
          success: true,
          data: [],
          propertyId: Number(propertyId)
        })
      }
      throw new Error(`HTTP ${response.status}: ${body}`)
    }

    const images = await response.json()

    // Ensure we return an array
    const imageArray = Array.isArray(images) ? images : []

    // Sort by order if available, otherwise keep original order
    const sortedImages = imageArray.sort((a, b) => {
      const orderA = a.order ?? 0
      const orderB = b.order ?? 0
      return orderA - orderB
    })

    console.log(`✅ Fetched ${sortedImages.length} images for property ${propertyId}`)

    return NextResponse.json({
      success: true,
      data: sortedImages,
      propertyId: Number(propertyId),
      count: sortedImages.length
    })
  } catch (error) {
    console.error(`❌ Error fetching images for property ${params.propertyId}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch property images',
        propertyId: params.propertyId
      },
      { status: 500 }
    )
  }
}


