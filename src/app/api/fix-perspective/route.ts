import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Perspective fix API called')
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const angle = parseFloat((formData.get('angle') as string) || '0')

    if (!imageFile) {
      return NextResponse.json({ success: false, error: 'No image file provided' }, { status: 400 })
    }

    console.log('📁 Processing image:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type,
      angle
    })

    // Apply perspective correction with rotation and automatic upscaling
    console.log('🔄 Applying perspective correction (with automatic 25% upscaling after rotation)...')
    const correctedBuffer = await correctPerspective(imageFile, angle)
    
    // Convert to base64 for JSON response
    const base64Image = Buffer.from(correctedBuffer).toString('base64');
    const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

    return NextResponse.json({
      success: true,
      correctedImage: imageDataUrl,
      appliedAngle: angle,
      method: 'rotation-with-upscale'
    });

  } catch (error) {
    console.error('❌ Error in perspective fix API route:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Perspective correction failed' 
    }, { status: 500 })
  }
}

// This function is no longer needed - removed Fal.ai dependency

async function correctPerspective(file: File, angle: number = 0): Promise<ArrayBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Get metadata to understand image dimensions
  const metadata = await sharp(buffer).metadata();
  const originalWidth = metadata.width || 1024;
  const originalHeight = metadata.height || 1024;
  
  console.log('📊 Original image dimensions:', {
    width: originalWidth,
    height: originalHeight,
    format: metadata.format
  });
  
  let processedBuffer = buffer;
  
  // Apply rotation if angle is specified
  if (angle !== 0) {
    console.log(`🔄 Step 1: Rotating image by ${angle} degrees...`);
    
    // Rotate with transparent background
    const rotatedBuffer = await sharp(buffer)
      .rotate(angle, {
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toBuffer();
    
    const rotatedMetadata = await sharp(rotatedBuffer).metadata();
    const rotatedWidth = rotatedMetadata.width || originalWidth;
    const rotatedHeight = rotatedMetadata.height || originalHeight;
    
    console.log(`   • Rotated canvas: ${rotatedWidth}x${rotatedHeight}`);
    
    // Step 2: Zoom into the content (scale up by 35%)
    console.log(`📐 Step 2: Zooming into image content by 35%...`);
    const zoomFactor = 1.35;
    const zoomedWidth = Math.round(rotatedWidth * zoomFactor);
    const zoomedHeight = Math.round(rotatedHeight * zoomFactor);
    
    console.log(`   • Zoomed dimensions: ${zoomedWidth}x${zoomedHeight} (+35% zoom)`);
    
    // Scale up the image content
    const zoomedBuffer = await sharp(rotatedBuffer)
      .resize(zoomedWidth, zoomedHeight, {
        fit: 'fill',
        kernel: 'lanczos3' // High-quality resampling
      })
      .toBuffer();
    
    // Step 3: Crop from center back to rotated canvas size
    console.log(`✂️ Step 3: Cropping back to ${rotatedWidth}x${rotatedHeight} (centered)...`);
    const cropLeft = Math.round((zoomedWidth - rotatedWidth) / 2);
    const cropTop = Math.round((zoomedHeight - rotatedHeight) / 2);
    
    console.log(`   • Crop from: (${cropLeft}, ${cropTop})`);
    console.log(`   • Effect: Zoomed-in view with no blank corners`);
    
    processedBuffer = await sharp(zoomedBuffer)
      .extract({
        left: cropLeft,
        top: cropTop,
        width: rotatedWidth,
        height: rotatedHeight
      })
      .toBuffer();
  }
  
  // Auto-enhance
  const finalBuffer = await sharp(processedBuffer)
    .sharpen() // Sharpen the image slightly
    .normalize() // Auto-level the image
    .jpeg({ quality: 95 })
    .toBuffer();
  
  return finalBuffer;
}
