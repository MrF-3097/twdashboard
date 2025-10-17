import { NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

/**
 * POST handler for expanding images using Bria AI model from fal.ai
 * 
 * This endpoint uses the Bria Expand model which is trained exclusively on licensed data
 * for safe and risk-free commercial use. It expands images beyond their borders in high quality.
 * 
 * @param req - Request containing FormData with image file and expansion parameters
 * @returns JSON response with the expanded image URL and metadata
 */
export async function POST(req: Request) {
  try {
    console.log('🚀 Image Expansion: Starting Bria AI expansion...')

    // Configure fal.ai client with API key from environment
    fal.config({
      credentials: process.env.FAL_KEY
    })

    const formData = await req.formData()
    const file = formData.get("image") as File
    const prompt = (formData.get("prompt") as string) || ""

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: "No image uploaded" 
      }, { status: 400 })
    }

    // Get original image dimensions using Sharp
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const sharp = (await import('sharp')).default
    const metadata = await sharp(buffer).metadata()
    
    const originalWidth = metadata.width || 1024
    const originalHeight = metadata.height || 1024

    // Calculate 10% expansion in all directions
    // This means the canvas should be 120% of the original size
    const expansionFactor = 1.2 // 10% padding on each side = 20% total increase
    const canvasWidth = Math.round(originalWidth * expansionFactor)
    const canvasHeight = Math.round(originalHeight * expansionFactor)

    // Calculate the position to center the original image in the expanded canvas
    // The original image needs to be centered, so we offset it by half the expansion
    const offsetX = Math.round((canvasWidth - originalWidth) / 2)
    const offsetY = Math.round((canvasHeight - originalHeight) / 2)

    console.log(`📁 Image details:`)
    console.log(`   • Name: ${file.name}`)
    console.log(`   • Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   • Type: ${file.type}`)
    console.log(`   • Original dimensions: ${originalWidth}x${originalHeight}`)
    console.log(`   • Expanded dimensions (10% all sides): ${canvasWidth}x${canvasHeight}`)
    console.log(`   • Original image position (centered): [${offsetX}, ${offsetY}]`)
    if (prompt) console.log(`   • Prompt: ${prompt}`)

    // Upload the file to fal.ai storage
    console.log('📤 Uploading image to fal.ai storage...')
    const imageUrl = await fal.storage.upload(file)
    console.log(`✅ Image uploaded: ${imageUrl}`)

    // Call the Bria expand model
    console.log('🎨 Calling Bria expand model...')
    const result = await fal.subscribe("fal-ai/bria/expand", {
      input: {
        image_url: imageUrl,
        canvas_size: [canvasWidth, canvasHeight],
        original_image_size: [originalWidth, originalHeight],
        original_image_location: [offsetX, offsetY],
        prompt: prompt || "extend the background naturally in all directions, maintaining the same style and lighting",
        sync_mode: true
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log)
        }
      },
    })

    console.log('✅ Image expansion completed')
    console.log('📊 Result:', result.data)

    return NextResponse.json({
      success: true,
      extendedImage: result.data.image.url,
      originalImage: imageUrl,
      originalSize: {
        width: originalWidth,
        height: originalHeight
      },
      extendedSize: { 
        width: result.data.image.width, 
        height: result.data.image.height 
      },
      fileSize: result.data.image.file_size,
      seed: result.data.seed,
      method: 'bria-expand',
      requestId: result.requestId,
      expansionPercent: 10
    })

  } catch (err: any) {
    console.error("❌ Image Expansion Error:", err)
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Image expansion failed' 
    }, { status: 500 })
  }
}
