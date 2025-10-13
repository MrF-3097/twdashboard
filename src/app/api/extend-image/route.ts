export async function POST(req: Request) {
  try {
    console.log('🚀 Image Expansion: Starting simple upscaling...')

    const formData = await req.formData();
    const file = formData.get("image") as File;
    const expansionPercent = parseFloat((formData.get("expansionPercent") as string) || "20");

    if (!file) {
      return NextResponse.json({ success: false, error: "No image uploaded" }, { status: 400 });
    }

    // Get original image dimensions
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const metadata = await sharp(buffer).metadata();
    
    const originalWidth = metadata.width || 1024;
    const originalHeight = metadata.height || 1024;

    console.log(`📁 Image details:`)
    console.log(`   • Name: ${file.name}`)
    console.log(`   • Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   • Type: ${file.type}`)
    console.log(`   • Original dimensions: ${originalWidth}x${originalHeight}`)
    console.log(`   • Expansion: +${expansionPercent}%`)

    // Calculate expanded dimensions while maintaining aspect ratio
    const expansionFactor = 1 + (expansionPercent / 100);
    const expandedWidth = Math.round(originalWidth * expansionFactor);
    const expandedHeight = Math.round(originalHeight * expansionFactor);

    console.log(`   • Expanded dimensions: ${expandedWidth}x${expandedHeight}`)
    console.log(`   • Using high-quality Lanczos3 resampling`)

    // Simple high-quality upscaling using Sharp
    const expandedBuffer = await sharp(buffer)
      .resize(expandedWidth, expandedHeight, {
        fit: 'fill',
        kernel: 'lanczos3' // High-quality resampling
      })
      .jpeg({ quality: 95 })
      .toBuffer();

    console.log('✅ Image expansion completed')

    // Convert to base64
    const expandedBase64 = expandedBuffer.toString('base64');
    const expandedDataUrl = `data:image/jpeg;base64,${expandedBase64}`;

    return NextResponse.json({
      success: true,
      extendedImage: expandedDataUrl,
      originalSize: { width: originalWidth, height: originalHeight },
      extendedSize: { width: expandedWidth, height: expandedHeight },
      expansionPercent,
      method: 'sharp-upscale'
    });
  } catch (err: any) {
    console.error("❌ Image Expansion Error:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Image expansion failed' 
    }, { status: 500 });
  }
}
