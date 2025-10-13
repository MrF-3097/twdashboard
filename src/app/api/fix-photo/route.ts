import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export const runtime = 'nodejs'

/**
 * Simple automatic angle detection
 * Returns 0 for now - auto-detection disabled
 * Users can manually adjust angle in the UI
 */
async function detectRotationAngle(buffer: Buffer): Promise<number> {
  console.log('ℹ️ Auto-detection disabled - use manual angle adjustment for best results')
  console.log('   Tip: Most tilted photos need 2-5° correction')
  return 0
}

/**
 * Fix photo: Auto-detect tilt, rotate, expand borders, zoom and crop
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Photo Fixer API called')
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const expansionPercent = parseFloat((formData.get('expansionPercent') as string) || '20')
    const autoDetectAngle = formData.get('autoDetectAngle') === 'true'
    const manualAngle = parseFloat((formData.get('angle') as string) || '0')

    if (!imageFile) {
      return NextResponse.json({ success: false, error: 'No image file provided' }, { status: 400 })
    }

    console.log('📁 Processing image:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type,
      autoDetectAngle,
      manualAngle,
      expansionPercent
    })

    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Step 1: Auto-detect rotation angle if enabled
    let detectedAngle = manualAngle
    if (autoDetectAngle && manualAngle === 0) {
      console.log('🔍 Auto-detecting rotation angle...')
      detectedAngle = await detectRotationAngle(buffer)
    }

    console.log(`📐 Using rotation angle: ${detectedAngle}°`)

    // Step 2: Process the image
    const fixedBuffer = await processPhoto(buffer, detectedAngle, expansionPercent)
    
    // Convert to base64
    const base64Image = Buffer.from(fixedBuffer).toString('base64')
    const imageDataUrl = `data:image/jpeg;base64,${base64Image}`

    return NextResponse.json({
      success: true,
      fixedImage: imageDataUrl,
      detectedAngle,
      expansionPercent,
      method: 'auto-fix-with-zoom'
    })

  } catch (error) {
    console.error('❌ Error in photo fixer API:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Photo fixing failed' 
    }, { status: 500 })
  }
}

/**
 * Process photo: Rotate, expand, zoom, and crop
 */
async function processPhoto(
  buffer: Buffer,
  angle: number,
  expansionPercent: number
): Promise<ArrayBuffer> {
  
  const metadata = await sharp(buffer).metadata()
  const originalWidth = metadata.width || 1024
  const originalHeight = metadata.height || 1024
  
  console.log('📊 Original dimensions:', { width: originalWidth, height: originalHeight })
  
  let processedBuffer = buffer
  
  // If rotation is needed
  if (Math.abs(angle) > 0.5) {
    console.log(`🔄 Step 1: Rotating by ${angle}°...`)
    
    // Rotate
    const rotatedBuffer = await sharp(buffer)
      .rotate(angle, {
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toBuffer()
    
    const rotatedMetadata = await sharp(rotatedBuffer).metadata()
    const rotatedWidth = rotatedMetadata.width || originalWidth
    const rotatedHeight = rotatedMetadata.height || originalHeight
    
    console.log(`   • Rotated canvas: ${rotatedWidth}x${rotatedHeight}`)
    
    // Step 2: Zoom into content (35% zoom to cover corners)
    console.log(`📐 Step 2: Zooming into content by 35%...`)
    const zoomFactor = 1.35
    const zoomedWidth = Math.round(rotatedWidth * zoomFactor)
    const zoomedHeight = Math.round(rotatedHeight * zoomFactor)
    
    const zoomedBuffer = await sharp(rotatedBuffer)
      .resize(zoomedWidth, zoomedHeight, {
        fit: 'fill',
        kernel: 'lanczos3'
      })
      .toBuffer()
    
    // Step 3: Crop from center back to rotated size
    console.log(`✂️ Step 3: Cropping to ${rotatedWidth}x${rotatedHeight} (centered)...`)
    const cropLeft = Math.round((zoomedWidth - rotatedWidth) / 2)
    const cropTop = Math.round((zoomedHeight - rotatedHeight) / 2)
    
    processedBuffer = await sharp(zoomedBuffer)
      .extract({
        left: cropLeft,
        top: cropTop,
        width: rotatedWidth,
        height: rotatedHeight
      })
      .toBuffer()
  }
  
  // Step 4: Optional additional expansion
  if (expansionPercent > 0) {
    console.log(`📏 Step 4: Applying ${expansionPercent}% expansion...`)
    const currentMetadata = await sharp(processedBuffer).metadata()
    const currentWidth = currentMetadata.width || originalWidth
    const currentHeight = currentMetadata.height || originalHeight
    
    const expansionFactor = 1 + (expansionPercent / 100)
    const expandedWidth = Math.round(currentWidth * expansionFactor)
    const expandedHeight = Math.round(currentHeight * expansionFactor)
    
    processedBuffer = await sharp(processedBuffer)
      .resize(expandedWidth, expandedHeight, {
        fit: 'fill',
        kernel: 'lanczos3'
      })
      .toBuffer()
    
    console.log(`   • Expanded to: ${expandedWidth}x${expandedHeight}`)
  }
  
  // Step 5: Final enhancement
  console.log('✨ Step 5: Applying final enhancements...')
  const finalBuffer = await sharp(processedBuffer)
    .sharpen()
    .normalize()
    .jpeg({ quality: 95 })
    .toBuffer()
  
  console.log('✅ Photo processing complete')
  
  return finalBuffer
}

