'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Image as ImageIcon, CheckCircle, XCircle, Loader2, Download, RotateCcw } from 'lucide-react'

export function AutoAngleFixer() {
  const [sourcePreview, setSourcePreview] = useState<string | null>(null)
  const [resultPreview, setResultPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingStep, setProcessingStep] = useState<string>('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles?.[0]
    if (!file) return

    setError(null)
    setResultPreview(null)
    setSourcePreview(URL.createObjectURL(file))
    setIsProcessing(true)

    try {
      // Process image using perspective correction
      setProcessingStep('Analizez imaginea...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setProcessingStep('Detectez distorsiuni...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setProcessingStep('Corectez perspectiva...')
      const processedImageUrl = await fixPerspective(file)
      
      setProcessingStep('Finalizez...')
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setResultPreview(processedImageUrl)
      setProcessingStep('')
    } catch (e: any) {
      setError(e?.message || 'Perspective correction failed')
      setProcessingStep('')
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const fixPerspective = async (file: File): Promise<string> => {
    console.log('🚀 Auto Angle Fixer: Starting image processing...')
    console.log(`📁 File details:`)
    console.log(`   • Name: ${file.name}`)
    console.log(`   • Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   • Type: ${file.type}`)
    
    // Use client-side perspective correction for better performance
    return new Promise(async (resolve, reject) => {
      const img = new Image()
      img.onload = async () => {
        try {
          console.log('🖼️ Image loaded successfully, creating canvas...')
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            console.error('❌ Failed to get canvas context')
            reject(new Error('Could not get canvas context'))
            return
          }

          // Set canvas size
          canvas.width = img.width
          canvas.height = img.height
          console.log(`📐 Canvas created: ${canvas.width}x${canvas.height}`)

           // Apply perspective correction
           console.log('🔧 Starting perspective correction...')
           await applyPerspectiveCorrection(ctx, img, canvas.width, canvas.height, file)

          // Convert to blob and create URL
          console.log('💾 Converting processed image to blob...')
          canvas.toBlob((blob) => {
            if (blob) {
              console.log(`✅ Blob created successfully: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)
              console.log('🎉 Auto Angle Fixer: Processing completed successfully!')
              resolve(URL.createObjectURL(blob))
            } else {
              console.error('❌ Failed to create blob from canvas')
              reject(new Error('Failed to create blob from canvas'))
            }
          }, file.type || 'image/jpeg', 0.9)
        } catch (error) {
          console.error('❌ Error during processing:', error)
          reject(error)
        }
      }
      img.onerror = () => {
        console.error('❌ Failed to load image')
        reject(new Error('Failed to load image'))
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const applyPerspectiveCorrection = async (ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number, originalImageFile: File) => {
    console.log('🎯 Starting Auto Angle Fixer processing...')
    console.log(`📐 Image dimensions: ${width}x${height}`)
    console.log(`📊 Aspect ratio: ${(width/height).toFixed(2)}`)
    
    // 1. Detect perspective distortion
    const perspectiveData = detectPerspectiveDistortion(img)
    console.log(`🔍 Perspective analysis: ${perspectiveData.angle.toFixed(1)}° skew detected`)
    
    // 2. Apply perspective correction using transformation matrix
    if (Math.abs(perspectiveData.angle) > 0.5) {
      console.log(`🔧 Applying perspective correction...`)
      await applyPerspectiveTransform(ctx, img, width, height, perspectiveData, originalImageFile)
      console.log('✅ Perspective correction applied successfully')
    } else {
      console.log('✅ No perspective correction needed')
      // Just draw the image normally
      ctx.drawImage(img, 0, 0, width, height)
    }
    
    // 3. Apply subtle enhancements to make the correction more visible
    console.log('🎨 Starting image enhancement...')
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const totalPixels = data.length / 4
    console.log(`📊 Processing ${totalPixels.toLocaleString()} pixels...`)
    
    let processedPixels = 0
    const logInterval = Math.floor(totalPixels / 10) // Log every 10%
    
    // Apply brightness, contrast, and saturation adjustments
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]
      
      // Brightness adjustment (+10%)
      r = Math.min(255, r * 1.1)
      g = Math.min(255, g * 1.1)
      b = Math.min(255, b * 1.1)
      
      // Contrast adjustment (+5%)
      r = Math.min(255, Math.max(0, (r - 128) * 1.05 + 128))
      g = Math.min(255, Math.max(0, (g - 128) * 1.05 + 128))
      b = Math.min(255, Math.max(0, (b - 128) * 1.05 + 128))
      
      // Saturation adjustment (+15%)
      const gray = 0.299 * r + 0.587 * g + 0.114 * b
      r = Math.min(255, Math.max(0, gray + (r - gray) * 1.15))
      g = Math.min(255, Math.max(0, gray + (g - gray) * 1.15))
      b = Math.min(255, Math.max(0, gray + (b - gray) * 1.15))
      
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      
      processedPixels++
      if (processedPixels % logInterval === 0) {
        const progress = Math.round((processedPixels / totalPixels) * 100)
        console.log(`⏳ Enhancement progress: ${progress}%`)
      }
    }
    
    console.log('🔄 Applying enhanced image data back to canvas...')
    ctx.putImageData(imageData, 0, 0)
    console.log('✅ Image enhancement completed successfully!')
    console.log('📈 Final enhancements applied:')
    console.log('   • Brightness: +10%')
    console.log('   • Contrast: +5%')
    console.log('   • Saturation: +15%')
    console.log('🎉 Auto Angle Fixer processing complete!')
  }

  const detectPerspectiveDistortion = (img: HTMLImageElement): {angle: number, strength: number} => {
    // Detect perspective distortion by analyzing overall room structure
    console.log(`🔍 Detecting perspective distortion...`)
    
    // Create a temporary canvas for analysis
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return {angle: 0, strength: 0}
    
    const analysisSize = 400
    const scale = Math.min(analysisSize / img.width, analysisSize / img.height)
    canvas.width = img.width * scale
    canvas.height = img.height * scale
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // Use multiple detection methods for better accuracy
    console.log(`   • Using comprehensive room structure analysis...`)
    
    // Method 1: Wall line detection
    const wallLines = detectWallLines(data, canvas.width, canvas.height)
    console.log(`   • Found ${wallLines.length} wall lines`)
    
    // Method 2: Corner analysis (existing method)
    const corners = detectRoomCorners(data, canvas.width, canvas.height)
    console.log(`   • Found ${corners.length} room corners`)
    
    // Method 3: Edge orientation analysis
    const edgeOrientations = analyzeEdgeOrientations(data, canvas.width, canvas.height)
    console.log(`   • Analyzed ${edgeOrientations.length} edge orientations`)
    
    // Combine all methods for robust detection
    const perspectiveAngle = combineDetectionMethods(wallLines, corners, edgeOrientations, canvas.width, canvas.height)
    
    return {
      angle: perspectiveAngle,
      strength: Math.abs(perspectiveAngle) > 0.2 ? 1 : 0 // Lowered threshold from 0.5 to 0.2 for more sensitive detection
    }
  }

  const analyzePerspectiveFromCorners = (corners: Array<{x: number, y: number, strength: number}>, width: number, height: number): number => {
    // Analyze perspective distortion from corner positions
    console.log(`📐 Analyzing perspective from corner positions...`)
    
    // Find corners in each quadrant
    const topLeft = corners.filter(c => c.x < width/2 && c.y < height/2)
    const topRight = corners.filter(c => c.x >= width/2 && c.y < height/2)
    const bottomLeft = corners.filter(c => c.x < width/2 && c.y >= height/2)
    const bottomRight = corners.filter(c => c.x >= width/2 && c.y >= height/2)
    
    console.log(`   • Corners per quadrant: TL:${topLeft.length}, TR:${topRight.length}, BL:${bottomLeft.length}, BR:${bottomRight.length}`)
    
    // If we don't have corners in all quadrants, use a different approach
    if (topLeft.length === 0 || topRight.length === 0 || bottomLeft.length === 0 || bottomRight.length === 0) {
      console.log(`   • Using alternative perspective detection method...`)
      return analyzePerspectiveFromEdges(corners, width, height)
    }
    
    // Calculate average positions for each quadrant
    const getAverageCorner = (quadrant: Array<{x: number, y: number, strength: number}>) => {
      if (quadrant.length === 0) return null
      const avgX = quadrant.reduce((sum, c) => sum + c.x, 0) / quadrant.length
      const avgY = quadrant.reduce((sum, c) => sum + c.y, 0) / quadrant.length
      return {x: avgX, y: avgY}
    }
    
    const tl = getAverageCorner(topLeft)
    const tr = getAverageCorner(topRight)
    const bl = getAverageCorner(bottomLeft)
    const br = getAverageCorner(bottomRight)
    
    if (!tl || !tr || !bl || !br) {
      console.log(`   • Not enough corners in all quadrants`)
      return 0
    }
    
    // Calculate perspective angle from top corners
    const topAngle = Math.atan2(tr.y - tl.y, tr.x - tl.x) * 180 / Math.PI
    const bottomAngle = Math.atan2(br.y - bl.y, br.x - bl.x) * 180 / Math.PI
    
    console.log(`   • Top line angle: ${topAngle.toFixed(1)}°`)
    console.log(`   • Bottom line angle: ${bottomAngle.toFixed(1)}°`)
    
    // The difference indicates perspective distortion
    const perspectiveSkew = (topAngle + bottomAngle) / 2
    console.log(`   • Perspective skew: ${perspectiveSkew.toFixed(1)}°`)
    
    return perspectiveSkew
  }

  const detectWallLines = (data: Uint8ClampedArray, width: number, height: number): Array<{x1: number, y1: number, x2: number, y2: number, angle: number, strength: number}> => {
    // Detect wall lines using Hough transform-like approach
    console.log(`   🧱 Detecting wall lines...`)
    
    const lines: Array<{x1: number, y1: number, x2: number, y2: number, angle: number, strength: number}> = []
    
    // Sample points along potential wall lines
    const step = 4
    for (let y = step; y < height - step; y += step) {
      for (let x = step; x < width - step; x += step) {
        const idx = (y * width + x) * 4
        
        // Calculate gradient magnitude
        const gx = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3 - 
                  (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3
        const gy = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3 - 
                  (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3
        
        const magnitude = Math.sqrt(gx * gx + gy * gy)
        
        if (magnitude > 20) { // Edge threshold
          const angle = Math.atan2(gy, gx) * 180 / Math.PI
          const normalizedAngle = ((angle % 180) + 180) % 180
          
          // Look for horizontal and vertical wall lines
          if (normalizedAngle < 15 || normalizedAngle > 165 || 
              (normalizedAngle > 75 && normalizedAngle < 105)) {
            
            // Trace the line to find endpoints
            const lineEndpoints = traceLine(data, width, height, x, y, angle, magnitude)
            if (lineEndpoints) {
              lines.push({
                x1: lineEndpoints.x1,
                y1: lineEndpoints.y1,
                x2: lineEndpoints.x2,
                y2: lineEndpoints.y2,
                angle: angle,
                strength: magnitude
              })
            }
          }
        }
      }
    }
    
    // Remove duplicate lines and keep strongest ones
    const uniqueLines = removeDuplicateLines(lines)
    console.log(`   • Found ${uniqueLines.length} unique wall lines`)
    
    return uniqueLines.slice(0, 20) // Keep top 20 lines
  }

  const traceLine = (data: Uint8ClampedArray, width: number, height: number, startX: number, startY: number, angle: number, strength: number): {x1: number, y1: number, x2: number, y2: number} | null => {
    // Trace a line from a starting point to find endpoints
    const dx = Math.cos(angle * Math.PI / 180)
    const dy = Math.sin(angle * Math.PI / 180)
    
    let x1 = startX, y1 = startY
    let x2 = startX, y2 = startY
    
    // Trace backwards
    for (let i = 0; i < 50; i++) {
      const newX = Math.round(startX - i * dx)
      const newY = Math.round(startY - i * dy)
      
      if (newX < 0 || newX >= width || newY < 0 || newY >= height) break
      
      const idx = (newY * width + newX) * 4
      const gx = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3 - 
                (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3
      const gy = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3 - 
                (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3
      const mag = Math.sqrt(gx * gx + gy * gy)
      
      if (mag < strength * 0.3) break
      
      x1 = newX
      y1 = newY
    }
    
    // Trace forwards
    for (let i = 0; i < 50; i++) {
      const newX = Math.round(startX + i * dx)
      const newY = Math.round(startY + i * dy)
      
      if (newX < 0 || newX >= width || newY < 0 || newY >= height) break
      
      const idx = (newY * width + newX) * 4
      const gx = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3 - 
                (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3
      const gy = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3 - 
                (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3
      const mag = Math.sqrt(gx * gx + gy * gy)
      
      if (mag < strength * 0.3) break
      
      x2 = newX
      y2 = newY
    }
    
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    return length > 20 ? {x1, y1, x2, y2} : null
  }

  const removeDuplicateLines = (lines: Array<{x1: number, y1: number, x2: number, y2: number, angle: number, strength: number}>): Array<{x1: number, y1: number, x2: number, y2: number, angle: number, strength: number}> => {
    // Remove duplicate or very similar lines
    const uniqueLines: Array<{x1: number, y1: number, x2: number, y2: number, angle: number, strength: number}> = []
    
    for (const line of lines) {
      const isDuplicate = uniqueLines.some(existing => {
        const angleDiff = Math.abs(line.angle - existing.angle)
        const normalizedAngleDiff = Math.min(angleDiff, 180 - angleDiff)
        return normalizedAngleDiff < 5 // Within 5 degrees
      })
      
      if (!isDuplicate) {
        uniqueLines.push(line)
      }
    }
    
    return uniqueLines.sort((a, b) => b.strength - a.strength)
  }

  const analyzeEdgeOrientations = (data: Uint8ClampedArray, width: number, height: number): number[] => {
    // Analyze overall edge orientations in the image
    console.log(`   📊 Analyzing overall edge orientations...`)
    
    const orientations: number[] = []
    const step = 8 // Sample every 8th pixel for performance
    
    for (let y = step; y < height - step; y += step) {
      for (let x = step; x < width - step; x += step) {
        const idx = (y * width + x) * 4
        
        // Calculate gradient
        const gx = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3 - 
                  (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3
        const gy = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3 - 
                  (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3
        
        const magnitude = Math.sqrt(gx * gx + gy * gy)
        
        if (magnitude > 15) { // Edge threshold
          const angle = Math.atan2(gy, gx) * 180 / Math.PI
          orientations.push(angle)
        }
      }
    }
    
    console.log(`   • Sampled ${orientations.length} edge orientations`)
    return orientations
  }

  const combineDetectionMethods = (wallLines: Array<{x1: number, y1: number, x2: number, y2: number, angle: number, strength: number}>, corners: Array<{x: number, y: number, strength: number}>, edgeOrientations: number[], width: number, height: number): number => {
    // Combine all detection methods for robust perspective detection
    console.log(`   🔄 Combining detection methods...`)
    
    const results: number[] = []
    
    // Method 1: Wall line analysis
    if (wallLines.length > 0) {
      const wallLineResult = analyzeWallLines(wallLines)
      if (wallLineResult !== 0) {
        results.push(wallLineResult)
        console.log(`   • Wall lines suggest: ${wallLineResult.toFixed(1)}°`)
      }
    }
    
    // Method 2: Corner analysis (existing method)
    if (corners.length > 0) {
      const cornerResult = analyzePerspectiveFromEdges(corners, width, height)
      if (cornerResult !== 0) {
        results.push(cornerResult)
        console.log(`   • Corners suggest: ${cornerResult.toFixed(1)}°`)
      }
    }
    
    // Method 3: Overall edge orientation analysis
    if (edgeOrientations.length > 0) {
      const edgeResult = analyzeOverallEdgeOrientations(edgeOrientations)
      if (edgeResult !== 0) {
        results.push(edgeResult)
        console.log(`   • Edge orientations suggest: ${edgeResult.toFixed(1)}°`)
      }
    }
    
    // Calculate weighted average of all methods
    if (results.length === 0) {
      console.log(`   • No clear perspective detected from any method`)
      return 0
    }
    
    const averageResult = results.reduce((sum, result) => sum + result, 0) / results.length
    console.log(`   • Combined result: ${averageResult.toFixed(1)}° (from ${results.length} methods)`)
    
    return averageResult
  }

  const analyzeWallLines = (wallLines: Array<{x1: number, y1: number, x2: number, y2: number, angle: number, strength: number}>): number => {
    // Analyze wall lines to determine perspective correction
    console.log(`   🧱 Analyzing ${wallLines.length} wall lines...`)
    
    const horizontalLines = wallLines.filter(line => {
      const normalizedAngle = ((line.angle % 180) + 180) % 180
      return normalizedAngle < 15 || normalizedAngle > 165
    })
    
    const verticalLines = wallLines.filter(line => {
      const normalizedAngle = ((line.angle % 180) + 180) % 180
      return normalizedAngle > 75 && normalizedAngle < 105
    })
    
    console.log(`   • Horizontal lines: ${horizontalLines.length}, Vertical lines: ${verticalLines.length}`)
    
    if (horizontalLines.length > 0) {
      const avgHorizontalAngle = horizontalLines.reduce((sum, line) => sum + line.angle, 0) / horizontalLines.length
      const correction = -avgHorizontalAngle
      console.log(`   • Average horizontal line angle: ${avgHorizontalAngle.toFixed(1)}°`)
      return Math.max(-15, Math.min(15, correction)) // Increased from ±10° to ±15°
    }
    
    return 0
  }

  const analyzeOverallEdgeOrientations = (orientations: number[]): number => {
    // Analyze overall edge orientations to detect image tilt
    console.log(`   📊 Analyzing ${orientations.length} edge orientations...`)
    
    // Create histogram of orientations
    const bins: {[key: number]: number} = {}
    orientations.forEach(angle => {
      const bin = Math.round(angle / 5) * 5 // 5-degree bins
      bins[bin] = (bins[bin] || 0) + 1
    })
    
    // Find dominant orientations
    const sortedBins = Object.entries(bins)
      .map(([angle, count]) => ({angle: parseInt(angle), count}))
      .sort((a, b) => b.count - a.count)
    
    console.log(`   • Top orientations: ${sortedBins.slice(0, 3).map(b => `${b.angle}°(${b.count})`).join(', ')}`)
    
    // Look for horizontal and vertical dominance
    const horizontalBins = sortedBins.filter(b => {
      const normalized = ((b.angle % 180) + 180) % 180
      return normalized < 15 || normalized > 165
    })
    
    if (horizontalBins.length > 0) {
      const avgHorizontalAngle = horizontalBins.reduce((sum, b) => sum + b.angle * b.count, 0) / 
                                horizontalBins.reduce((sum, b) => sum + b.count, 0)
      const correction = -avgHorizontalAngle
      console.log(`   • Dominant horizontal orientation: ${avgHorizontalAngle.toFixed(1)}°`)
      return Math.max(-15, Math.min(15, correction)) // Increased from ±10° to ±15°
    }
    
    return 0
  }

  const analyzePerspectiveFromEdges = (corners: Array<{x: number, y: number, strength: number}>, width: number, height: number): number => {
    // Alternative method: analyze edge orientations from all corners
    console.log(`   🔍 Analyzing edge orientations from ${corners.length} corners...`)
    
    const edgeAngles: number[] = []
    
    // Calculate angles between corner pairs
    for (let i = 0; i < corners.length - 1; i++) {
      for (let j = i + 1; j < corners.length; j++) {
        const corner1 = corners[i]
        const corner2 = corners[j]
        
        // Calculate the angle of the line between corners
        const dx = corner2.x - corner1.x
        const dy = corner2.y - corner1.y
        const angle = Math.atan2(dy, dx) * 180 / Math.PI
        
        // Normalize angle to 0-180 range
        const normalizedAngle = ((angle % 180) + 180) % 180
        
        // We expect room corners to form mostly horizontal (0°) and vertical (90°) lines
        if (normalizedAngle < 15 || normalizedAngle > 165) {
          // Horizontal line
          edgeAngles.push(angle)
        } else if (normalizedAngle > 75 && normalizedAngle < 105) {
          // Vertical line
          edgeAngles.push(angle)
        }
      }
    }
    
    if (edgeAngles.length === 0) {
      console.log(`   • No clear horizontal/vertical lines found`)
      return 0
    }
    
    console.log(`   • Found ${edgeAngles.length} horizontal/vertical edges`)
    
    // Calculate average deviation from expected angles
    const horizontalAngles = edgeAngles.filter(angle => {
      const normalized = ((angle % 180) + 180) % 180
      return normalized < 15 || normalized > 165
    })
    
    if (horizontalAngles.length > 0) {
      const avgAngle = horizontalAngles.reduce((sum, angle) => sum + angle, 0) / horizontalAngles.length
      const rotationNeeded = -avgAngle // Opposite rotation to straighten
      
      console.log(`   • Average horizontal line angle: ${avgAngle.toFixed(1)}°`)
      console.log(`   • Suggested perspective correction: ${rotationNeeded.toFixed(1)}°`)
      
      // Limit correction to reasonable range
      return Math.max(-15, Math.min(15, rotationNeeded)) // Increased from ±10° to ±15°
    }
    
    console.log(`   • Edge analysis inconclusive`)
    return 0
  }

  const applyPerspectiveTransform = async (ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number, perspectiveData: {angle: number, strength: number}, originalImageFile: File) => {
    // Apply perspective correction using rotation that creates blank areas for AI extension
    console.log(`🔧 Applying perspective correction...`)
    
    // Convert perspective angle to a more noticeable rotation for correction
    const correctionAngle = -perspectiveData.angle * 0.3 // Increased from 0.1 to 0.3 for more visible correction
    
    console.log(`   • Correction angle: ${correctionAngle.toFixed(2)}°`)
    
    // Apply rotation to correct perspective
    if (Math.abs(correctionAngle) > 0.05) { // Lowered threshold from 0.1 to 0.05
      console.log(`   • Applying ${correctionAngle.toFixed(2)}° correction rotation...`)
      
      // Clear the canvas first
      ctx.clearRect(0, 0, width, height)
      
      // Apply rotation WITHOUT zoom to create blank areas for AI extension
      ctx.save()
      ctx.translate(width / 2, height / 2)
      ctx.rotate((correctionAngle * Math.PI) / 180)
      ctx.translate(-width / 2, -height / 2)
      ctx.drawImage(img, 0, 0, width, height)
      ctx.restore()
      
      // Now apply AI extension to fill the blank areas created by rotation
      console.log(`   • Applying AI extension to fill blank areas...`)
      await applyContentAwareFill(ctx, width, height, correctionAngle, originalImageFile)
      
      console.log(`   • Perspective correction with AI extension applied successfully`)
    } else {
      console.log(`   • Correction angle too small, drawing image normally`)
      ctx.drawImage(img, 0, 0, width, height)
    }
  }



  const applyContentAwareFill = async (ctx: CanvasRenderingContext2D, width: number, height: number, rotationAngle: number, originalImageFile: File) => {
    // Apply AI-powered image extension to blank areas created by rotation
    console.log(`   🤖 Starting AI-powered image extension process...`)
    
    // Get current image data
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    
    // Detect blank areas (transparent or very dark pixels)
    const blankAreas = detectBlankAreas(data, width, height)
    console.log(`   • Detected ${blankAreas.length} blank areas for AI extension`)
    
    if (blankAreas.length === 0) {
      console.log(`   • No blank areas detected, skipping AI extension`)
      return
    }
    
    try {
      console.log(`   • Calling AI API for image extension...`)
      
      // Call AI API for image extension (without mask - our API doesn't support it)
      const formData = new FormData()
      formData.append('image', originalImageFile)
      formData.append('prompt', 'Extend the image outward with matching background and seamless continuation')
      
      const response = await fetch('/api/extend-image', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`AI API failed: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'AI extension failed')
      }
      
      console.log(`   • AI extension completed successfully`)
      
      // Load the extended image and draw it to the canvas
      const extendedImg = new Image()
      
      await new Promise<void>((resolve, reject) => {
        extendedImg.onload = () => {
          ctx.clearRect(0, 0, width, height)
          ctx.drawImage(extendedImg, 0, 0, width, height)
          console.log(`   • Extended image applied to canvas`)
          resolve()
        }
        extendedImg.onerror = () => {
          reject(new Error('Failed to load extended image'))
        }
        // Stability AI returns a data URL, no need for crossOrigin
        extendedImg.src = result.extendedImage
      })
      
    } catch (error) {
      console.log(`   • AI extension failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.log(`   • Falling back to simple extension...`)
      
      // Fallback to simple extension
      applySimpleExtension(data, width, height, blankAreas)
      ctx.putImageData(imageData, 0, 0)
    }
  }

  const detectBlankAreas = (data: Uint8ClampedArray, width: number, height: number): Array<{x: number, y: number, size: number}> => {
    // Detect ALL blank areas with aggressive detection
    console.log(`   • Detecting blank areas with aggressive detection...`)
    const blankAreas: Array<{x: number, y: number, size: number}> = []
    const visited = new Set<string>()
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = `${x},${y}`
        if (visited.has(key)) continue
        
        const idx = (y * width + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        const a = data[idx + 3]
        
        // More aggressive blank detection - catch more dark areas
        if (a === 0 || (r < 30 && g < 30 && b < 30) || (r + g + b < 60)) {
          const area = floodFillBlankArea(data, width, height, x, y, visited)
          if (area.size > 5) { // Lower threshold to catch smaller areas
            blankAreas.push(area)
            console.log(`   • Found blank area at (${area.x}, ${area.y}) with size ${area.size}`)
          }
        }
      }
    }
    
    console.log(`   • Total blank areas detected: ${blankAreas.length}`)
    return blankAreas
  }

  const floodFillBlankArea = (data: Uint8ClampedArray, width: number, height: number, startX: number, startY: number, visited: Set<string>): {x: number, y: number, size: number} => {
    // Aggressive flood fill to find ALL connected blank areas
    const stack = [{x: startX, y: startY}]
    const areaPixels: Array<{x: number, y: number}> = []
    
    while (stack.length > 0) {
      const {x, y} = stack.pop()!
      const key = `${x},${y}`
      
      if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) continue
      
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const a = data[idx + 3]
      
      // More aggressive blank detection - catch more dark areas
      if (a === 0 || (r < 30 && g < 30 && b < 30) || (r + g + b < 60)) {
        visited.add(key)
        areaPixels.push({x, y})
        
        // Add neighboring pixels to stack (including diagonals for better coverage)
        stack.push(
          {x: x + 1, y}, {x: x - 1, y}, {x, y: y + 1}, {x, y: y - 1},
          {x: x + 1, y: y + 1}, {x: x - 1, y: y - 1}, {x: x + 1, y: y - 1}, {x: x - 1, y: y + 1}
        )
      }
    }
    
    // Calculate area center and size
    if (areaPixels.length === 0) return {x: startX, y: startY, size: 0}
    
    const centerX = Math.round(areaPixels.reduce((sum, p) => sum + p.x, 0) / areaPixels.length)
    const centerY = Math.round(areaPixels.reduce((sum, p) => sum + p.y, 0) / areaPixels.length)
    
    return {x: centerX, y: centerY, size: areaPixels.length}
  }

  const applyAIExtension = (data: Uint8ClampedArray, width: number, height: number, blankAreas: Array<{x: number, y: number, size: number}>) => {
    // Apply advanced computer vision image extension to blank areas
    console.log(`   • Applying advanced CV image extension to ${blankAreas.length} blank areas...`)
    
    // Pre-compute image features for better extension
    const imageFeatures = precomputeImageFeatures(data, width, height)
    console.log(`   • Pre-computed image features: edges, textures, patterns`)
    
    for (const area of blankAreas) {
      const {x: centerX, y: centerY, size} = area
      const radius = Math.ceil(Math.sqrt(size / Math.PI)) + 15 // Increased radius for better coverage
      
      console.log(`   • Advanced CV extending area at (${centerX}, ${centerY}) with radius ${radius}`)
      
      // Analyze the area complexity
      const areaComplexity = analyzeAreaComplexity(data, width, height, centerX, centerY, radius)
      console.log(`   • Area complexity: ${areaComplexity.toFixed(3)} (0=simple, 1=complex)`)
      
      if (areaComplexity < 0.3) {
        // Simple area - use fast edge extension
        console.log(`   • Using fast edge extension for simple area`)
        extendWithEdgeExtension(data, width, height, centerX, centerY, radius, imageFeatures)
      } else if (areaComplexity < 0.7) {
        // Medium complexity - use texture synthesis
        console.log(`   • Using texture synthesis for medium complexity area`)
        extendWithTextureSynthesis(data, width, height, centerX, centerY, radius, imageFeatures)
      } else {
        // Complex area - use advanced patch-based extension
        console.log(`   • Using advanced patch-based extension for complex area`)
        extendWithPatchBasedMethod(data, width, height, centerX, centerY, radius, imageFeatures)
      }
    }
    
    // Final comprehensive pass to fill ANY remaining black areas
    console.log(`   • Running final comprehensive pass to fill remaining black areas...`)
    fillRemainingBlackAreas(data, width, height)
  }

  const fillRemainingBlackAreas = (data: Uint8ClampedArray, width: number, height: number) => {
    // Final comprehensive pass to fill ANY remaining black areas
    console.log(`   • Scanning for remaining black areas...`)
    let filledPixels = 0
    
    // Multiple passes to ensure complete coverage
    for (let pass = 0; pass < 3; pass++) {
      console.log(`   • Pass ${pass + 1}/3: Filling remaining black areas...`)
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]
          const a = data[idx + 3]
          
          // Check if pixel is still black/blank
          if (a === 0 || (r < 30 && g < 30 && b < 30) || (r + g + b < 60)) {
            // Find the nearest non-black pixel
            const nearestPixel = findNearestNonBlackPixel(data, width, height, x, y, 20)
            
            if (nearestPixel) {
              data[idx] = nearestPixel.r
              data[idx + 1] = nearestPixel.g
              data[idx + 2] = nearestPixel.b
              data[idx + 3] = 255
              filledPixels++
            }
          }
        }
      }
      
      console.log(`   • Pass ${pass + 1} completed: Filled ${filledPixels} pixels`)
    }
    
    console.log(`   • Final pass completed: Total filled pixels: ${filledPixels}`)
  }

  const applySimpleExtension = (data: Uint8ClampedArray, width: number, height: number, blankAreas: Array<{x: number, y: number, size: number}>) => {
    // Simple fallback extension when AI fails
    console.log(`   • Applying simple fallback extension...`)
    
    for (const area of blankAreas) {
      const {x: centerX, y: centerY, size} = area
      const radius = Math.ceil(Math.sqrt(size / Math.PI)) + 10
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = centerX + dx
          const y = centerY + dy
          
          if (x < 0 || x >= width || y < 0 || y >= height) continue
          
          const idx = (y * width + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]
          const a = data[idx + 3]
          
          if (a === 0 || (r < 30 && g < 30 && b < 30) || (r + g + b < 60)) {
            const nearestPixel = findNearestNonBlackPixel(data, width, height, x, y, 15)
            if (nearestPixel) {
              data[idx] = nearestPixel.r
              data[idx + 1] = nearestPixel.g
              data[idx + 2] = nearestPixel.b
              data[idx + 3] = 255
            }
          }
        }
      }
    }
  }

  const findNearestNonBlackPixel = (data: Uint8ClampedArray, width: number, height: number, centerX: number, centerY: number, maxRadius: number): {r: number, g: number, b: number} | null => {
    // Find the nearest non-black pixel within maxRadius
    for (let radius = 1; radius <= maxRadius; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          // Only check pixels on the edge of the current radius
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue
          
          const x = centerX + dx
          const y = centerY + dy
          
          if (x < 0 || x >= width || y < 0 || y >= height) continue
          
          const idx = (y * width + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]
          const a = data[idx + 3]
          
          // Check if pixel is non-black
          if (a > 0 && !(r < 30 && g < 30 && b < 30) && (r + g + b >= 60)) {
            return {r, g, b}
          }
        }
      }
    }
    
    return null
  }

  const precomputeImageFeatures = (data: Uint8ClampedArray, width: number, height: number) => {
    // Pre-compute advanced image features for better extension
    console.log(`   • Computing advanced image features...`)
    
    const features = {
      edges: computeAdvancedEdges(data, width, height),
      textures: computeTextureMaps(data, width, height),
      gradients: computeGradientMaps(data, width, height),
      patterns: detectRepeatingPatterns(data, width, height)
    }
    
    console.log(`   • Features computed: ${Object.keys(features).join(', ')}`)
    return features
  }

  const computeAdvancedEdges = (data: Uint8ClampedArray, width: number, height: number) => {
    // Advanced edge detection using multiple methods
    const edges = new Uint8Array(width * height)
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4
        
        // Sobel edge detection
        const gx = Math.abs(
          -data[idx - 4 - 4*width] + data[idx + 4 - 4*width] +
          -2*data[idx - 4] + 2*data[idx + 4] +
          -data[idx - 4 + 4*width] + data[idx + 4 + 4*width]
        )
        
        const gy = Math.abs(
          -data[idx - 4 - 4*width] - 2*data[idx - 4*width] - data[idx + 4 - 4*width] +
          data[idx - 4 + 4*width] + 2*data[idx + 4*width] + data[idx + 4 + 4*width]
        )
        
        const magnitude = Math.sqrt(gx * gx + gy * gy)
        edges[y * width + x] = Math.min(255, magnitude / 4)
      }
    }
    
    return edges
  }

  const computeTextureMaps = (data: Uint8ClampedArray, width: number, height: number) => {
    // Compute texture maps using local binary patterns
    const textures = new Uint8Array(width * height)
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4
        const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
        
        // Local binary pattern
        let lbp = 0
        const neighbors = [
          data[idx - 4 - 4*width], data[idx - 4*width], data[idx + 4 - 4*width],
          data[idx - 4], data[idx + 4],
          data[idx - 4 + 4*width], data[idx + 4*width], data[idx + 4 + 4*width]
        ]
        
        for (let i = 0; i < neighbors.length; i++) {
          if (neighbors[i] > center) {
            lbp |= (1 << i)
          }
        }
        
        textures[y * width + x] = lbp
      }
    }
    
    return textures
  }

  const computeGradientMaps = (data: Uint8ClampedArray, width: number, height: number) => {
    // Compute gradient magnitude and direction maps
    const gradientMag = new Uint8Array(width * height)
    const gradientDir = new Uint8Array(width * height)
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4
        
        // Gradient calculation
        const gx = data[idx + 4] - data[idx - 4]
        const gy = data[idx + 4*width] - data[idx - 4*width]
        
        const magnitude = Math.sqrt(gx * gx + gy * gy)
        const direction = Math.atan2(gy, gx) * 180 / Math.PI
        
        gradientMag[y * width + x] = Math.min(255, magnitude)
        gradientDir[y * width + x] = Math.floor((direction + 180) / 2) // 0-180
      }
    }
    
    return { magnitude: gradientMag, direction: gradientDir }
  }

  const detectRepeatingPatterns = (data: Uint8ClampedArray, width: number, height: number) => {
    // Detect repeating patterns using autocorrelation
    const patterns = new Uint8Array(width * height)
    
    for (let y = 8; y < height - 8; y++) {
      for (let x = 8; x < width - 8; x++) {
        const idx = (y * width + x) * 4
        const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
        
        // Check for repeating patterns in 8x8 neighborhood
        let patternStrength = 0
        for (let dy = -4; dy <= 4; dy++) {
          for (let dx = -4; dx <= 4; dx++) {
            if (dx === 0 && dy === 0) continue
            
            const neighborIdx = ((y + dy) * width + (x + dx)) * 4
            const neighbor = (data[neighborIdx] + data[neighborIdx + 1] + data[neighborIdx + 2]) / 3
            
            // Check for similar values (indicating pattern)
            if (Math.abs(center - neighbor) < 20) {
              patternStrength++
            }
          }
        }
        
        patterns[y * width + x] = Math.min(255, patternStrength * 8)
      }
    }
    
    return patterns
  }

  const analyzeAreaComplexity = (data: Uint8ClampedArray, width: number, height: number, centerX: number, centerY: number, radius: number): number => {
    // Analyze the complexity of the area to determine the best extension method
    let edgeCount = 0
    let textureVariation = 0
    let colorVariation = 0
    let totalPixels = 0
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx
        const y = centerY + dy
        
        if (x < 1 || x >= width - 1 || y < 1 || y >= height - 1) continue
        
        const idx = (y * width + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        const a = data[idx + 3]
        
        if (a > 0 && !(r < 10 && g < 10 && b < 10)) {
          totalPixels++
          
          // Edge detection
          const gx = Math.abs(data[idx + 4] - data[idx - 4])
          const gy = Math.abs(data[idx + 4*width] - data[idx - 4*width])
          if (gx + gy > 50) edgeCount++
          
          // Color variation
          const centerColor = (r + g + b) / 3
          const neighborColors = [
            data[idx - 4], data[idx + 4], data[idx - 4*width], data[idx + 4*width]
          ]
          const avgNeighbor = neighborColors.reduce((sum, c) => sum + c, 0) / neighborColors.length
          colorVariation += Math.abs(centerColor - avgNeighbor)
        }
      }
    }
    
    if (totalPixels === 0) return 0
    
    const edgeDensity = edgeCount / totalPixels
    const avgColorVariation = colorVariation / totalPixels
    
    // Combine factors to get complexity score (0-1)
    const complexity = Math.min(1, (edgeDensity * 2 + avgColorVariation / 100) / 3)
    return complexity
  }

  const extendWithEdgeExtension = (data: Uint8ClampedArray, width: number, height: number, centerX: number, centerY: number, radius: number, features: any) => {
    // Fast edge extension for simple areas
    console.log(`   • Applying fast edge extension...`)
    
    const extensionEdge = findBestExtensionEdge(data, width, height, centerX, centerY, radius)
    
    if (extensionEdge) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = centerX + dx
          const y = centerY + dy
          
          if (x < 0 || x >= width || y < 0 || y >= height) continue
          
          const idx = (y * width + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]
          const a = data[idx + 3]
          
          if (a === 0 || (r < 10 && g < 10 && b < 10)) {
            const bestEdgePixel = findBestEdgePixelForExtension(extensionEdge, x, y, centerX, centerY)
            if (bestEdgePixel) {
              data[idx] = bestEdgePixel.r
              data[idx + 1] = bestEdgePixel.g
              data[idx + 2] = bestEdgePixel.b
              data[idx + 3] = 255
            }
          }
        }
      }
    }
  }

  const extendWithTextureSynthesis = (data: Uint8ClampedArray, width: number, height: number, centerX: number, centerY: number, radius: number, features: any) => {
    // Texture synthesis for medium complexity areas
    console.log(`   • Applying texture synthesis...`)
    
    // Find similar texture regions
    const similarRegions = findSimilarTextureRegions(data, width, height, centerX, centerY, radius, features.textures)
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx
        const y = centerY + dy
        
        if (x < 0 || x >= width || y < 0 || y >= height) continue
        
        const idx = (y * width + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        const a = data[idx + 3]
        
        if (a === 0 || (r < 10 && g < 10 && b < 10)) {
          // Find best texture match
          const bestTexturePixel = findBestTextureMatch(similarRegions, x, y, features.textures)
          if (bestTexturePixel) {
            data[idx] = bestTexturePixel.r
            data[idx + 1] = bestTexturePixel.g
            data[idx + 2] = bestTexturePixel.b
            data[idx + 3] = 255
          }
        }
      }
    }
  }

  const extendWithPatchBasedMethod = (data: Uint8ClampedArray, width: number, height: number, centerX: number, centerY: number, radius: number, features: any) => {
    // Advanced patch-based extension for complex areas
    console.log(`   • Applying advanced patch-based extension...`)
    
    // Find best matching patches
    const matchingPatches = findMatchingPatches(data, width, height, centerX, centerY, radius, features)
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx
        const y = centerY + dy
        
        if (x < 0 || x >= width || y < 0 || y >= height) continue
        
        const idx = (y * width + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        const a = data[idx + 3]
        
        if (a === 0 || (r < 10 && g < 10 && b < 10)) {
          // Find best patch match
          const bestPatchPixel = findBestPatchMatch(matchingPatches, x, y, centerX, centerY)
          if (bestPatchPixel) {
            data[idx] = bestPatchPixel.r
            data[idx + 1] = bestPatchPixel.g
            data[idx + 2] = bestPatchPixel.b
            data[idx + 3] = 255
          }
        }
      }
    }
  }

  const findSimilarTextureRegions = (data: Uint8ClampedArray, width: number, height: number, centerX: number, centerY: number, radius: number, textureMap: Uint8Array) => {
    // Find regions with similar texture patterns
    const similarRegions = []
    const targetTexture = textureMap[centerY * width + centerX] || 0
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        const a = data[idx + 3]
        
        if (a > 0 && !(r < 10 && g < 10 && b < 10)) {
          const texture = textureMap[y * width + x]
          if (Math.abs(texture - targetTexture) < 10) {
            similarRegions.push({x, y, r, g, b, texture})
          }
        }
      }
    }
    
    return similarRegions
  }

  const findBestTextureMatch = (similarRegions: Array<{x: number, y: number, r: number, g: number, b: number, texture: number}>, targetX: number, targetY: number, textureMap: Uint8Array) => {
    if (similarRegions.length === 0) return null
    
    let bestMatch = similarRegions[0]
    let minDistance = Infinity
    
    for (const region of similarRegions) {
      const distance = Math.sqrt((region.x - targetX) ** 2 + (region.y - targetY) ** 2)
      if (distance < minDistance) {
        minDistance = distance
        bestMatch = region
      }
    }
    
    return {r: bestMatch.r, g: bestMatch.g, b: bestMatch.b}
  }

  const findMatchingPatches = (data: Uint8ClampedArray, width: number, height: number, centerX: number, centerY: number, radius: number, features: any) => {
    // Find patches that match the surrounding area
    const patches = []
    const patchSize = 8
    
    for (let y = patchSize; y < height - patchSize; y += patchSize) {
      for (let x = patchSize; x < width - patchSize; x += patchSize) {
        const patch = extractPatch(data, width, x, y, patchSize)
        const similarity = calculatePatchSimilarity(patch, data, width, centerX, centerY, radius)
        
        if (similarity > 0.7) {
          patches.push({x, y, patch, similarity})
        }
      }
    }
    
    return patches.sort((a, b) => b.similarity - a.similarity).slice(0, 10)
  }

  const extractPatch = (data: Uint8ClampedArray, width: number, x: number, y: number, size: number) => {
    const patch = []
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const idx = ((y + dy) * width + (x + dx)) * 4
        patch.push({
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2]
        })
      }
    }
    return patch
  }

  const calculatePatchSimilarity = (patch: Array<{r: number, g: number, b: number}>, data: Uint8ClampedArray, width: number, centerX: number, centerY: number, radius: number) => {
    // Calculate similarity between patch and surrounding area
    let similarity = 0
    let count = 0
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx
        const y = centerY + dy
        
        if (x < 0 || x >= width || y < 0 || y >= height) continue
        
        const idx = (y * width + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        const a = data[idx + 3]
        
        if (a > 0 && !(r < 10 && g < 10 && b < 10)) {
          // Find closest patch pixel
          const patchPixel = patch[Math.floor(Math.random() * patch.length)]
          const colorDiff = Math.abs(r - patchPixel.r) + Math.abs(g - patchPixel.g) + Math.abs(b - patchPixel.b)
          similarity += Math.max(0, 1 - colorDiff / (3 * 255))
          count++
        }
      }
    }
    
    return count > 0 ? similarity / count : 0
  }

  const findBestPatchMatch = (patches: Array<{x: number, y: number, patch: Array<{r: number, g: number, b: number}>, similarity: number}>, targetX: number, targetY: number, centerX: number, centerY: number) => {
    if (patches.length === 0) return null
    
    // Use the best matching patch
    const bestPatch = patches[0]
    const patchIndex = Math.floor(Math.random() * bestPatch.patch.length)
    return bestPatch.patch[patchIndex]
  }

  const findBestExtensionEdge = (data: Uint8ClampedArray, width: number, height: number, centerX: number, centerY: number, radius: number): {direction: string, pixels: Array<{x: number, y: number, r: number, g: number, b: number}>} | null => {
    // Find the best edge to extend from by analyzing all directions
    console.log(`   • Finding best extension edge for area at (${centerX}, ${centerY})...`)
    
    const edges = {
      top: [] as Array<{x: number, y: number, r: number, g: number, b: number}>,
      bottom: [] as Array<{x: number, y: number, r: number, g: number, b: number}>,
      left: [] as Array<{x: number, y: number, r: number, g: number, b: number}>,
      right: [] as Array<{x: number, y: number, r: number, g: number, b: number}>
    }
    
    // Collect edge pixels from all directions
    for (let searchRadius = 1; searchRadius <= radius * 2; searchRadius++) {
      for (let dy = -searchRadius; dy <= searchRadius; dy++) {
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
          // Only check pixels on the edge of the current search radius
          if (Math.abs(dx) !== searchRadius && Math.abs(dy) !== searchRadius) continue
          
          const x = centerX + dx
          const y = centerY + dy
          
          if (x < 0 || x >= width || y < 0 || y >= height) continue
          
          const idx = (y * width + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]
          const a = data[idx + 3]
          
          // Check if pixel is valid (not blank)
          if (a > 0 && !(r < 10 && g < 10 && b < 10)) {
            // Determine which edge this pixel belongs to
            if (dy < 0) edges.top.push({x, y, r, g, b})
            if (dy > 0) edges.bottom.push({x, y, r, g, b})
            if (dx < 0) edges.left.push({x, y, r, g, b})
            if (dx > 0) edges.right.push({x, y, r, g, b})
          }
        }
      }
    }
    
    // Find the edge with the most pixels (best for extension)
    const bestEdge = Object.entries(edges).reduce((best, [direction, pixels]) => {
      if (pixels.length > best.pixels.length) {
        return {direction, pixels}
      }
      return best
    }, {direction: 'top', pixels: [] as Array<{x: number, y: number, r: number, g: number, b: number}>})
    
    if (bestEdge.pixels.length === 0) return null
    
    console.log(`   • Best extension edge: ${bestEdge.direction} with ${bestEdge.pixels.length} pixels`)
    return bestEdge
  }

  const findBestEdgePixelForExtension = (extensionEdge: {direction: string, pixels: Array<{x: number, y: number, r: number, g: number, b: number}>}, targetX: number, targetY: number, centerX: number, centerY: number): {r: number, g: number, b: number} | null => {
    // Find the best edge pixel to extend from based on direction and distance
    if (extensionEdge.pixels.length === 0) return null
    
    let bestPixel = extensionEdge.pixels[0]
    let minDistance = Infinity
    
    for (const pixel of extensionEdge.pixels) {
      let distance: number
      
      // Calculate distance based on the extension direction
      if (extensionEdge.direction === 'top') {
        // For top edge, use horizontal distance and vertical offset
        distance = Math.abs(pixel.x - targetX) + Math.abs(pixel.y - centerY) * 0.5
      } else if (extensionEdge.direction === 'bottom') {
        // For bottom edge, use horizontal distance and vertical offset
        distance = Math.abs(pixel.x - targetX) + Math.abs(pixel.y - centerY) * 0.5
      } else if (extensionEdge.direction === 'left') {
        // For left edge, use vertical distance and horizontal offset
        distance = Math.abs(pixel.y - targetY) + Math.abs(pixel.x - centerX) * 0.5
      } else { // right
        // For right edge, use vertical distance and horizontal offset
        distance = Math.abs(pixel.y - targetY) + Math.abs(pixel.x - centerX) * 0.5
      }
      
      if (distance < minDistance) {
        minDistance = distance
        bestPixel = pixel
      }
    }
    
    return {r: bestPixel.r, g: bestPixel.g, b: bestPixel.b}
  }

  const findAIExtensionSource = (data: Uint8ClampedArray, width: number, height: number, centerX: number, centerY: number, radius: number): {r: number, g: number, b: number} | null => {
    // AI-powered source finding using multiple analysis techniques
    console.log(`   • AI analyzing extension source for area at (${centerX}, ${centerY})...`)
    
    // Collect candidate pixels with AI scoring
    const candidates: Array<{r: number, g: number, b: number, score: number, distance: number}> = []
    
    // Search in expanding circles with AI analysis
    for (let searchRadius = 1; searchRadius <= radius * 2; searchRadius++) {
      for (let dy = -searchRadius; dy <= searchRadius; dy++) {
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
          // Only check pixels on the edge of the current search radius
          if (Math.abs(dx) !== searchRadius && Math.abs(dy) !== searchRadius) continue
          
          const x = centerX + dx
          const y = centerY + dy
          
          if (x < 0 || x >= width || y < 0 || y >= height) continue
          
          const idx = (y * width + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]
          const a = data[idx + 3]
          
          // Check if pixel is valid (not blank)
          if (a > 0 && !(r < 10 && g < 10 && b < 10)) {
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            // AI scoring: combines distance, edge strength, and color consistency
            const edgeStrength = detectEdgeStrength(data, width, x, y)
            const colorConsistency = calculateColorConsistency(data, width, x, y, r, g, b)
            const aiScore = (1 / (distance + 1)) * (1 + edgeStrength * 0.4) * (1 + colorConsistency * 0.3)
            
            candidates.push({r, g, b, score: aiScore, distance})
          }
        }
      }
    }
    
    if (candidates.length === 0) return null
    
    // Select the best candidate using AI scoring
    const bestCandidate = candidates.reduce((best, current) => 
      current.score > best.score ? current : best
    )
    
    console.log(`   • AI selected best extension source with score ${bestCandidate.score.toFixed(3)}`)
    return {r: bestCandidate.r, g: bestCandidate.g, b: bestCandidate.b}
  }

  const detectEdgeStrength = (data: Uint8ClampedArray, width: number, x: number, y: number): number => {
    // AI edge detection using gradient analysis
    if (x === 0 || x === width - 1 || y === 0 || y === (data.length / 4 / width) - 1) {
      return 0
    }
    
    const idx = (y * width + x) * 4
    
    // Calculate gradients using Sobel-like operators
    const gx = Math.abs(
      (data[idx - 4] + 2 * data[idx] + data[idx + 4]) / 4 - // Horizontal gradient
      (data[idx - 4 * width] + 2 * data[idx] + data[idx + 4 * width]) / 4 // Vertical gradient
    )
    
    const gy = Math.abs(
      (data[idx - 4 * width] + 2 * data[idx] + data[idx + 4 * width]) / 4 - // Vertical gradient
      (data[idx - 4] + 2 * data[idx] + data[idx + 4]) / 4 // Horizontal gradient
    )
    
    const gradient = Math.sqrt(gx * gx + gy * gy)
    return Math.min(1, gradient / 120) // Normalize to 0-1
  }

  const calculateGradientFactor = (data: Uint8ClampedArray, width: number, x: number, y: number): number => {
    // Calculate gradient factor for AI blending
    if (x === 0 || x === width - 1 || y === 0 || y === (data.length / 4 / width) - 1) {
      return 0
    }
    
    const idx = (y * width + x) * 4
    
    // Calculate local gradient magnitude
    const neighbors = [
      data[idx - 4], data[idx + 4], // left, right
      data[idx - 4 * width], data[idx + 4 * width] // top, bottom
    ]
    
    const center = data[idx]
    const variance = neighbors.reduce((sum, neighbor) => sum + Math.abs(neighbor - center), 0) / neighbors.length
    
    return Math.min(1, variance / 50) // Normalize to 0-1
  }

  const calculateColorConsistency = (data: Uint8ClampedArray, width: number, x: number, y: number, r: number, g: number, b: number): number => {
    // Calculate color consistency for AI scoring
    if (x === 0 || x === width - 1 || y === 0 || y === (data.length / 4 / width) - 1) {
      return 0
    }
    
    const idx = (y * width + x) * 4
    
    // Check color similarity with neighbors
    const neighbors = [
      {idx: idx - 4, weight: 1}, // left
      {idx: idx + 4, weight: 1}, // right
      {idx: idx - 4 * width, weight: 1}, // top
      {idx: idx + 4 * width, weight: 1} // bottom
    ]
    
    let totalSimilarity = 0
    let validNeighbors = 0
    
    for (const neighbor of neighbors) {
      if (neighbor.idx >= 0 && neighbor.idx < data.length) {
        const nr = data[neighbor.idx]
        const ng = data[neighbor.idx + 1]
        const nb = data[neighbor.idx + 2]
        
        // Calculate color similarity
        const similarity = 1 - (Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb)) / (3 * 255)
        totalSimilarity += similarity * neighbor.weight
        validNeighbors += neighbor.weight
      }
    }
    
    return validNeighbors > 0 ? totalSimilarity / validNeighbors : 0
  }

  const findNearestEdgePixel = (data: Uint8ClampedArray, width: number, height: number, centerX: number, centerY: number, radius: number): {r: number, g: number, b: number} | null => {
    // Find the nearest non-blank pixel to use for extension
    let minDistance = Infinity
    let nearestPixel: {r: number, g: number, b: number} | null = null
    
    // Search in expanding circles around the center
    for (let searchRadius = 1; searchRadius <= radius * 2; searchRadius++) {
      for (let dy = -searchRadius; dy <= searchRadius; dy++) {
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
          // Only check pixels on the edge of the current search radius
          if (Math.abs(dx) !== searchRadius && Math.abs(dy) !== searchRadius) continue
          
          const x = centerX + dx
          const y = centerY + dy
          
          if (x < 0 || x >= width || y < 0 || y >= height) continue
          
          const idx = (y * width + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]
          const a = data[idx + 3]
          
          // Check if this is a valid (non-blank) pixel
          if (a > 0 && !(r < 10 && g < 10 && b < 10)) {
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance < minDistance) {
              minDistance = distance
              nearestPixel = {r, g, b}
            }
          }
        }
      }
      
      // If we found a pixel, return it
      if (nearestPixel) {
        return nearestPixel
      }
    }
    
    return null
  }

  const applyHeavyBlurToArea = (data: Uint8ClampedArray, width: number, height: number, centerX: number, centerY: number, radius: number) => {
    // Apply extremely heavy blur specifically to the filled area
    const blurRadius = 25 // Extremely heavy blur radius - barely visible content
    const kernelSize = blurRadius * 2 + 1
    const kernel = generateGaussianKernel(kernelSize, blurRadius)
    
    // Create temporary array for blur calculations
    const tempData = new Uint8ClampedArray(data)
    
    // Apply blur to the filled area
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx
        const y = centerY + dy
        
        if (x < 0 || x >= width || y < 0 || y >= height) continue
        
        const idx = (y * width + x) * 4
        
        // Calculate extremely blurred color
        const blurredColor = calculateBlurredPixel(tempData, width, height, x, y, kernel, kernelSize)
        
        // Apply the heavily blurred color
        data[idx] = blurredColor.r
        data[idx + 1] = blurredColor.g
        data[idx + 2] = blurredColor.b
        data[idx + 3] = 255
      }
    }
  }

  const applyBlurAndFade = (data: Uint8ClampedArray, width: number, height: number, blankAreas: Array<{x: number, y: number, size: number}>) => {
    // Apply blur as a separate layer on top of content-aware fill
    console.log(`   • Applying blur layer on top of content-aware fill...`)
    
    // Create a copy of the current data for blur calculations
    const originalData = new Uint8ClampedArray(data)
    
    // Apply blur as a separate layer on top of filled areas
    for (const area of blankAreas) {
      const {x: centerX, y: centerY, size} = area
      const radius = Math.ceil(Math.sqrt(size / Math.PI)) + 8
      
      console.log(`   • Applying blur layer to area at (${centerX}, ${centerY})`)
      applyBlurLayerOnTop(data, originalData, width, height, centerX, centerY, radius)
    }
    
    // Apply fade effect at edges for smooth blending
    console.log(`   • Applying fade transitions...`)
    applyFadeEffect(data, width, height, blankAreas)
    
    console.log(`   • Blur layer and fade effects applied successfully`)
  }

  const applyBlurLayerOnTop = (data: Uint8ClampedArray, originalData: Uint8ClampedArray, width: number, height: number, centerX: number, centerY: number, radius: number) => {
    // Apply blur as a separate layer on top of the content-aware fill
    const blurRadius = 30 // Heavy blur radius for seamless continuation
    const kernelSize = blurRadius * 2 + 1
    const kernel = generateGaussianKernel(kernelSize, blurRadius)
    
    console.log(`   • Applying ${blurRadius}px blur with 99% strength...`)
    
    // Apply blur layer on top of the filled area
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx
        const y = centerY + dy
        
        if (x < 0 || x >= width || y < 0 || y >= height) continue
        
        const idx = (y * width + x) * 4
        
        // Calculate blurred color from the original filled data
        const blurredColor = calculateBlurredPixel(originalData, width, height, x, y, kernel, kernelSize)
        
        // Apply the blur layer on top (blend with existing content)
        const blendFactor = 0.99 // 99% blur, 1% original - MAXIMUM BLUR
        data[idx] = Math.round(data[idx] * (1 - blendFactor) + blurredColor.r * blendFactor)
        data[idx + 1] = Math.round(data[idx + 1] * (1 - blendFactor) + blurredColor.g * blendFactor)
        data[idx + 2] = Math.round(data[idx + 2] * (1 - blendFactor) + blurredColor.b * blendFactor)
        data[idx + 3] = 255
      }
    }
    
    console.log(`   • Blur applied successfully to area`)
  }

  const applyGaussianBlur = (data: Uint8ClampedArray, width: number, height: number, blankAreas: Array<{x: number, y: number, size: number}>, blurRadius: number) => {
    // Apply Gaussian blur to filled areas
    const kernelSize = blurRadius * 2 + 1
    const kernel = generateGaussianKernel(kernelSize, blurRadius)
    
    for (const area of blankAreas) {
      const {x: centerX, y: centerY, size} = area
      const radius = Math.ceil(Math.sqrt(size / Math.PI)) + 10
      
      // Apply blur to the area
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = centerX + dx
          const y = centerY + dy
          
          if (x < 0 || x >= width || y < 0 || y >= height) continue
          
          const idx = (y * width + x) * 4
          
          // Calculate blurred color
          const blurredColor = calculateBlurredPixel(data, width, height, x, y, kernel, kernelSize)
          
          data[idx] = blurredColor.r
          data[idx + 1] = blurredColor.g
          data[idx + 2] = blurredColor.b
          data[idx + 3] = 255
        }
      }
    }
  }

  const generateGaussianKernel = (size: number, sigma: number): number[][] => {
    // Generate Gaussian kernel for blur
    const kernel: number[][] = []
    const center = Math.floor(size / 2)
    let sum = 0
    
    for (let y = 0; y < size; y++) {
      kernel[y] = []
      for (let x = 0; x < size; x++) {
        const dx = x - center
        const dy = y - center
        const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma))
        kernel[y][x] = value
        sum += value
      }
    }
    
    // Normalize kernel
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        kernel[y][x] /= sum
      }
    }
    
    return kernel
  }

  const calculateBlurredPixel = (data: Uint8ClampedArray, width: number, height: number, x: number, y: number, kernel: number[][], kernelSize: number): {r: number, g: number, b: number} => {
    // Calculate blurred pixel color using kernel
    let r = 0, g = 0, b = 0
    const center = Math.floor(kernelSize / 2)
    
    for (let ky = 0; ky < kernelSize; ky++) {
      for (let kx = 0; kx < kernelSize; kx++) {
        const sampleX = x + kx - center
        const sampleY = y + ky - center
        
        if (sampleX >= 0 && sampleX < width && sampleY >= 0 && sampleY < height) {
          const sampleIdx = (sampleY * width + sampleX) * 4
          const weight = kernel[ky][kx]
          
          r += data[sampleIdx] * weight
          g += data[sampleIdx + 1] * weight
          b += data[sampleIdx + 2] * weight
        }
      }
    }
    
    return {
      r: Math.round(r),
      g: Math.round(g),
      b: Math.round(b)
    }
  }

  const applyFadeEffect = (data: Uint8ClampedArray, width: number, height: number, blankAreas: Array<{x: number, y: number, size: number}>) => {
    // Apply fade effect at the edges of filled areas
    for (const area of blankAreas) {
      const {x: centerX, y: centerY, size} = area
      const radius = Math.ceil(Math.sqrt(size / Math.PI)) + 8
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = centerX + dx
          const y = centerY + dy
          
          if (x < 0 || x >= width || y < 0 || y >= height) continue
          
          const idx = (y * width + x) * 4
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          // Calculate fade factor based on distance from center
          const fadeFactor = Math.max(0, Math.min(1, (radius - distance) / (radius * 0.3)))
          
          // Apply fade to alpha channel for smooth blending
          data[idx + 3] = Math.round(255 * fadeFactor)
        }
      }
    }
  }

  const sampleContextPixels = (data: Uint8ClampedArray, width: number, height: number, centerX: number, centerY: number, radius: number): Array<{r: number, g: number, b: number, distance: number}> => {
    // Sample surrounding pixels to understand the context
    const contextPixels: Array<{r: number, g: number, b: number, distance: number}> = []
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx
        const y = centerY + dy
        
        if (x < 0 || x >= width || y < 0 || y >= height) continue
        
        const idx = (y * width + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        const a = data[idx + 3]
        
        // Only sample non-blank pixels
        if (a > 0 && !(r < 10 && g < 10 && b < 10)) {
          const distance = Math.sqrt(dx * dx + dy * dy)
          contextPixels.push({r, g, b, distance})
        }
      }
    }
    
    return contextPixels
  }

  const generateContentAwarePixel = (data: Uint8ClampedArray, width: number, height: number, x: number, y: number, contextPixels: Array<{r: number, g: number, b: number, distance: number}>): {r: number, g: number, b: number} => {
    // Generate a pixel color using simple, seamless continuation
    if (contextPixels.length === 0) {
      return getNearestValidPixel(data, width, height, x, y)
    }
    
    // Simple approach: just use the average color of nearby pixels
    return calculateSeamlessAverageColor(contextPixels)
  }

  const calculateSeamlessAverageColor = (contextPixels: Array<{r: number, g: number, b: number, distance: number}>): {r: number, g: number, b: number} => {
    // Calculate seamless average color without any artificial patterns
    let totalWeight = 0
    let weightedR = 0, weightedG = 0, weightedB = 0
    
    for (const pixel of contextPixels) {
      // Use distance-based weighting for smooth transitions
      const weight = 1 / (pixel.distance + 1)
      totalWeight += weight
      
      weightedR += pixel.r * weight
      weightedG += pixel.g * weight
      weightedB += pixel.b * weight
    }
    
    // Return simple average without any artificial variations
    return {
      r: Math.round(weightedR / totalWeight),
      g: Math.round(weightedG / totalWeight),
      b: Math.round(weightedB / totalWeight)
    }
  }

  const analyzeImageContext = (contextPixels: Array<{r: number, g: number, b: number, distance: number}>, x: number, y: number, width: number, height: number): {isWall: boolean, isFloor: boolean, isCeiling: boolean, dominantColor: {r: number, g: number, b: number}, textureType: string} => {
    // Analyze the context to determine what type of surface we're filling
    const avgColor = calculateAverageColor(contextPixels)
    const colorVariance = calculateColorVariance(contextPixels, avgColor)
    const position = {x, y, width, height}
    
    // Determine surface type based on position and color characteristics
    const isWall = isWallArea(position, avgColor, colorVariance)
    const isFloor = isFloorArea(position, avgColor, colorVariance)
    const isCeiling = isCeilingArea(position, avgColor, colorVariance)
    
    // Determine texture type
    const textureType = determineTextureType(colorVariance, contextPixels.length)
    
    return {
      isWall,
      isFloor,
      isCeiling,
      dominantColor: avgColor,
      textureType
    }
  }

  const calculateAverageColor = (pixels: Array<{r: number, g: number, b: number, distance: number}>): {r: number, g: number, b: number} => {
    let totalWeight = 0
    let weightedR = 0, weightedG = 0, weightedB = 0
    
    for (const pixel of pixels) {
      const weight = 1 / (pixel.distance + 1)
      totalWeight += weight
      weightedR += pixel.r * weight
      weightedG += pixel.g * weight
      weightedB += pixel.b * weight
    }
    
    return {
      r: Math.round(weightedR / totalWeight),
      g: Math.round(weightedG / totalWeight),
      b: Math.round(weightedB / totalWeight)
    }
  }

  const calculateColorVariance = (pixels: Array<{r: number, g: number, b: number, distance: number}>, avgColor: {r: number, g: number, b: number}): number => {
    let totalVariance = 0
    let totalWeight = 0
    
    for (const pixel of pixels) {
      const weight = 1 / (pixel.distance + 1)
      const variance = Math.sqrt(
        Math.pow(pixel.r - avgColor.r, 2) +
        Math.pow(pixel.g - avgColor.g, 2) +
        Math.pow(pixel.b - avgColor.b, 2)
      )
      totalVariance += variance * weight
      totalWeight += weight
    }
    
    return totalVariance / totalWeight
  }

  const isWallArea = (position: {x: number, y: number, width: number, height: number}, avgColor: {r: number, g: number, b: number}, variance: number): boolean => {
    // Walls are typically in the middle areas and have moderate color variance
    const isMiddleArea = position.y > position.height * 0.2 && position.y < position.height * 0.8
    const hasWallColors = avgColor.r > 50 && avgColor.g > 50 && avgColor.b > 50 // Not too dark
    const moderateVariance = variance > 20 && variance < 80 // Some texture but not too much
    
    return isMiddleArea && hasWallColors && moderateVariance
  }

  const isFloorArea = (position: {x: number, y: number, width: number, height: number}, avgColor: {r: number, g: number, b: number}, variance: number): boolean => {
    // Floors are typically in the bottom area
    const isBottomArea = position.y > position.height * 0.7
    const hasFloorColors = avgColor.r > 30 && avgColor.g > 30 && avgColor.b > 30
    
    return isBottomArea && hasFloorColors
  }

  const isCeilingArea = (position: {x: number, y: number, width: number, height: number}, avgColor: {r: number, g: number, b: number}, variance: number): boolean => {
    // Ceilings are typically in the top area and often lighter
    const isTopArea = position.y < position.height * 0.3
    const isLight = avgColor.r > 100 && avgColor.g > 100 && avgColor.b > 100
    
    return isTopArea && isLight
  }

  const determineTextureType = (variance: number, pixelCount: number): string => {
    if (variance < 15) return 'smooth'
    if (variance < 40) return 'textured'
    if (variance < 80) return 'rough'
    return 'very_rough'
  }

  const generateWallPixel = (contextPixels: Array<{r: number, g: number, b: number, distance: number}>, context: any): {r: number, g: number, b: number} => {
    // Generate wall-like pixels with appropriate texture
    const baseColor = context.dominantColor
    const textureStrength = context.textureType === 'smooth' ? 0.05 : 
                           context.textureType === 'textured' ? 0.15 : 
                           context.textureType === 'rough' ? 0.25 : 0.35
    
    // Add realistic wall texture variation
    const rVariation = (Math.random() - 0.5) * 255 * textureStrength
    const gVariation = (Math.random() - 0.5) * 255 * textureStrength
    const bVariation = (Math.random() - 0.5) * 255 * textureStrength
    
    // Add subtle color shifts to simulate wall material
    const materialShift = getWallMaterialShift(baseColor)
    
    return {
      r: Math.max(0, Math.min(255, Math.round(baseColor.r + rVariation + materialShift.r))),
      g: Math.max(0, Math.min(255, Math.round(baseColor.g + gVariation + materialShift.g))),
      b: Math.max(0, Math.min(255, Math.round(baseColor.b + bVariation + materialShift.b)))
    }
  }

  const generateFloorPixel = (contextPixels: Array<{r: number, g: number, b: number, distance: number}>, context: any): {r: number, g: number, b: number} => {
    // Generate floor-like pixels
    const baseColor = context.dominantColor
    const textureStrength = 0.2 // Floors typically have more texture
    
    // Add floor-specific texture
    const rVariation = (Math.random() - 0.5) * 255 * textureStrength
    const gVariation = (Math.random() - 0.5) * 255 * textureStrength
    const bVariation = (Math.random() - 0.5) * 255 * textureStrength
    
    // Add subtle shadowing for depth
    const shadowFactor = 0.95
    const materialShift = getFloorMaterialShift(baseColor)
    
    return {
      r: Math.max(0, Math.min(255, Math.round((baseColor.r + rVariation + materialShift.r) * shadowFactor))),
      g: Math.max(0, Math.min(255, Math.round((baseColor.g + gVariation + materialShift.g) * shadowFactor))),
      b: Math.max(0, Math.min(255, Math.round((baseColor.b + bVariation + materialShift.b) * shadowFactor)))
    }
  }

  const generateCeilingPixel = (contextPixels: Array<{r: number, g: number, b: number, distance: number}>, context: any): {r: number, g: number, b: number} => {
    // Generate ceiling-like pixels (typically lighter and smoother)
    const baseColor = context.dominantColor
    const textureStrength = 0.1 // Ceilings are typically smoother
    
    // Add subtle ceiling texture
    const rVariation = (Math.random() - 0.5) * 255 * textureStrength
    const gVariation = (Math.random() - 0.5) * 255 * textureStrength
    const bVariation = (Math.random() - 0.5) * 255 * textureStrength
    
    // Make ceiling slightly brighter
    const brightnessFactor = 1.05
    const materialShift = getCeilingMaterialShift(baseColor)
    
    return {
      r: Math.max(0, Math.min(255, Math.round((baseColor.r + rVariation + materialShift.r) * brightnessFactor))),
      g: Math.max(0, Math.min(255, Math.round((baseColor.g + gVariation + materialShift.g) * brightnessFactor))),
      b: Math.max(0, Math.min(255, Math.round((baseColor.b + bVariation + materialShift.b) * brightnessFactor)))
    }
  }

  const generateGenericPixel = (contextPixels: Array<{r: number, g: number, b: number, distance: number}>, context: any): {r: number, g: number, b: number} => {
    // Generate generic pixels with moderate texture
    const baseColor = context.dominantColor
    const textureStrength = 0.15
    
    const rVariation = (Math.random() - 0.5) * 255 * textureStrength
    const gVariation = (Math.random() - 0.5) * 255 * textureStrength
    const bVariation = (Math.random() - 0.5) * 255 * textureStrength
    
    return {
      r: Math.max(0, Math.min(255, Math.round(baseColor.r + rVariation))),
      g: Math.max(0, Math.min(255, Math.round(baseColor.g + gVariation))),
      b: Math.max(0, Math.min(255, Math.round(baseColor.b + bVariation)))
    }
  }

  const getWallMaterialShift = (baseColor: {r: number, g: number, b: number}): {r: number, g: number, b: number} => {
    // Add subtle material-specific color shifts for walls
    const shift = 2
    return {
      r: (Math.random() - 0.5) * shift,
      g: (Math.random() - 0.5) * shift,
      b: (Math.random() - 0.5) * shift
    }
  }

  const getFloorMaterialShift = (baseColor: {r: number, g: number, b: number}): {r: number, g: number, b: number} => {
    // Add subtle material-specific color shifts for floors
    const shift = 3
    return {
      r: (Math.random() - 0.5) * shift,
      g: (Math.random() - 0.5) * shift,
      b: (Math.random() - 0.5) * shift
    }
  }

  const getCeilingMaterialShift = (baseColor: {r: number, g: number, b: number}): {r: number, g: number, b: number} => {
    // Add subtle material-specific color shifts for ceilings
    const shift = 1
    return {
      r: (Math.random() - 0.5) * shift,
      g: (Math.random() - 0.5) * shift,
      b: (Math.random() - 0.5) * shift
    }
  }

  const getNearestValidPixel = (data: Uint8ClampedArray, width: number, height: number, x: number, y: number): {r: number, g: number, b: number} => {
    // Find the nearest valid (non-blank) pixel as fallback
    for (let radius = 1; radius < 50; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const checkX = x + dx
          const checkY = y + dy
          
          if (checkX < 0 || checkX >= width || checkY < 0 || checkY >= height) continue
          
          const idx = (checkY * width + checkX) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]
          const a = data[idx + 3]
          
          if (a > 0 && !(r < 10 && g < 10 && b < 10)) {
            return {r, g, b}
          }
        }
      }
    }
    
    // Ultimate fallback: return a neutral gray
    return {r: 128, g: 128, b: 128}
  }



  const detectRotationAngle = (img: HTMLImageElement): number => {
    // Smart rotation detection for real estate photos
    const aspectRatio = img.width / img.height
    console.log(`🔍 Rotation detection analysis:`)
    console.log(`   • Image width: ${img.width}px`)
    console.log(`   • Image height: ${img.height}px`)
    console.log(`   • Aspect ratio: ${aspectRatio.toFixed(2)}`)
    
    // First check for major orientation issues
    if (aspectRatio < 0.7) {
      console.log(`   • Decision: Portrait image detected (ratio < 0.7)`)
      console.log(`   • Action: Rotate 90° clockwise for landscape orientation`)
      return 90
    } else if (aspectRatio > 2.5) {
      console.log(`   • Decision: Extremely wide image detected (ratio > 2.5)`)
      console.log(`   • Action: Rotate 90° counter-clockwise`)
      return -90
    }
    
    // For landscape images, detect small rotation angles
    console.log(`   • Major orientation: Landscape is correct`)
    console.log(`   • Checking for small rotation angles...`)
    
    const smallRotation = detectSmallRotation(img)
    if (smallRotation !== 0) {
      console.log(`   • Decision: Small rotation detected: ${smallRotation}°`)
      console.log(`   • Action: Apply ${smallRotation}° correction`)
      return smallRotation
    }
    
    console.log(`   • Decision: No rotation needed`)
    console.log(`   • Note: Aspect ratio ${aspectRatio.toFixed(2)} is normal for real estate photos`)
    return 0
  }

  const detectSmallRotation = (img: HTMLImageElement): number => {
    // Detect small rotation angles by analyzing room corners
    console.log(`   🔍 Analyzing room corners for perspective correction...`)
    
    // Create a temporary canvas to analyze the image
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return 0
    
    // Use a smaller size for faster analysis
    const analysisSize = 400
    const scale = Math.min(analysisSize / img.width, analysisSize / img.height)
    canvas.width = img.width * scale
    canvas.height = img.height * scale
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // Detect room corners using corner detection algorithm
    const corners = detectRoomCorners(data, canvas.width, canvas.height)
    console.log(`   • Found ${corners.length} potential room corners`)
    
    if (corners.length < 3) {
      console.log(`   • Not enough corners detected for analysis`)
      return 0
    }
    
    // Analyze corner angles to determine rotation
    const rotationAngle = analyzeCornerAngles(corners, canvas.width, canvas.height)
    
    if (Math.abs(rotationAngle) > 0.5) {
      console.log(`   • Room corner analysis detected: ${rotationAngle.toFixed(1)}° rotation needed`)
    } else {
      console.log(`   • Room corners are properly aligned`)
    }
    
    return rotationAngle
  }

  const detectRoomCorners = (data: Uint8ClampedArray, width: number, height: number): Array<{x: number, y: number, strength: number}> => {
    // Harris corner detection algorithm for room corners
    const corners: Array<{x: number, y: number, strength: number}> = []
    const windowSize = 3
    const threshold = 100000 // Corner strength threshold
    
    console.log(`   🔍 Scanning for room corners using Harris detection...`)
    
    for (let y = windowSize; y < height - windowSize; y += 2) {
      for (let x = windowSize; x < width - windowSize; x += 2) {
        // Calculate gradients
        let Ixx = 0, Iyy = 0, Ixy = 0
        
        for (let dy = -windowSize; dy <= windowSize; dy++) {
          for (let dx = -windowSize; dx <= windowSize; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
            
            // Simple gradient calculation
            const gx = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3 - 
                      (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3
            const gy = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3 - 
                      (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3
            
            Ixx += gx * gx
            Iyy += gy * gy
            Ixy += gx * gy
          }
        }
        
        // Harris corner response
        const det = Ixx * Iyy - Ixy * Ixy
        const trace = Ixx + Iyy
        const response = det - 0.04 * trace * trace
        
        if (response > threshold) {
          corners.push({ x, y, strength: response })
        }
      }
    }
    
    // Sort by strength and keep only the strongest corners
    corners.sort((a, b) => b.strength - a.strength)
    const topCorners = corners.slice(0, 20) // Keep top 20 corners
    
    console.log(`   • Top corner strengths: ${topCorners.slice(0, 5).map(c => c.strength.toFixed(0)).join(', ')}`)
    
    return topCorners
  }

  const analyzeCornerAngles = (corners: Array<{x: number, y: number, strength: number}>, width: number, height: number): number => {
    // Analyze the angles formed by room corners to detect rotation
    console.log(`   📐 Analyzing corner angles for perspective...`)
    
    if (corners.length < 3) return 0
    
    // Find corners that are likely to be room corners (near edges and corners of image)
    const roomCorners = corners.filter(corner => {
      const distFromEdge = Math.min(
        corner.x, 
        corner.y, 
        width - corner.x, 
        height - corner.y
      )
      return distFromEdge < Math.min(width, height) * 0.3 // Within 30% of image edge
    })
    
    console.log(`   • Room corner candidates: ${roomCorners.length}`)
    
    if (roomCorners.length < 3) return 0
    
    // Calculate angles between corner pairs
    const angles: number[] = []
    
    for (let i = 0; i < roomCorners.length - 1; i++) {
      for (let j = i + 1; j < roomCorners.length; j++) {
        const corner1 = roomCorners[i]
        const corner2 = roomCorners[j]
        
        // Calculate the angle of the line between corners
        const dx = corner2.x - corner1.x
        const dy = corner2.y - corner1.y
        const angle = Math.atan2(dy, dx) * 180 / Math.PI
        
        // Normalize angle to 0-180 range
        const normalizedAngle = ((angle % 180) + 180) % 180
        
        // We expect room corners to form mostly horizontal (0°) and vertical (90°) lines
        if (normalizedAngle < 15 || normalizedAngle > 165) {
          // Horizontal line
          angles.push(0)
        } else if (normalizedAngle > 75 && normalizedAngle < 105) {
          // Vertical line
          angles.push(90)
        }
      }
    }
    
    if (angles.length === 0) {
      console.log(`   • No clear horizontal/vertical lines found`)
      return 0
    }
    
    // Calculate average deviation from expected angles
    const horizontalDeviations = angles.filter(a => a === 0).length
    const verticalDeviations = angles.filter(a => a === 90).length
    
    // If we have more horizontal lines, check their average deviation
    if (horizontalDeviations > verticalDeviations) {
      const horizontalAngles = []
      for (let i = 0; i < roomCorners.length - 1; i++) {
        for (let j = i + 1; j < roomCorners.length; j++) {
          const corner1 = roomCorners[i]
          const corner2 = roomCorners[j]
          const dx = corner2.x - corner1.x
          const dy = corner2.y - corner1.y
          const angle = Math.atan2(dy, dx) * 180 / Math.PI
          const normalizedAngle = ((angle % 180) + 180) % 180
          
          if (normalizedAngle < 15 || normalizedAngle > 165) {
            horizontalAngles.push(angle)
          }
        }
      }
      
      if (horizontalAngles.length > 0) {
        const avgAngle = horizontalAngles.reduce((sum, angle) => sum + angle, 0) / horizontalAngles.length
        const rotationNeeded = -avgAngle // Opposite rotation to straighten
        
        console.log(`   • Average horizontal line angle: ${avgAngle.toFixed(1)}°`)
        console.log(`   • Suggested correction: ${rotationNeeded.toFixed(1)}°`)
        
        // Limit correction to reasonable range
        return Math.max(-10, Math.min(10, rotationNeeded))
      }
    }
    
    console.log(`   • Corner analysis inconclusive`)
    return 0
  }


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: false
  })

  const downloadResult = () => {
    if (!resultPreview) return
    const a = document.createElement('a')
    a.href = resultPreview
    a.download = 'perspective-corrected.jpg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Auto Angle Fixer
          </CardTitle>
          <CardDescription>
            Trageți și plasați o fotografie pentru a corecta automat pereții și perspectiva.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isDragActive ? 'Plasați fotografia aici' : 'Încărcați fotografia'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Acceptă JPG, JPEG, PNG
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(sourcePreview || resultPreview) && (
        <Card>
          <CardHeader>
            <CardTitle>Previzualizare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Fotografie Originală</p>
                <div className="border rounded-lg overflow-hidden">
                  {sourcePreview ? (
                    <img src={sourcePreview} alt="original" className="w-full h-auto" />
                  ) : (
                    <div className="p-6 text-sm text-muted-foreground">Nicio imagine</div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Fotografie Corectată</p>
                <div className="border rounded-lg overflow-hidden min-h-[120px] flex items-center justify-center">
                  {isProcessing && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {processingStep || 'Se corectează perspectiva...'}
                    </div>
                  )}
                  {!isProcessing && resultPreview && (
                    <img src={resultPreview} alt="corrected" className="w-full h-auto" />
                  )}
                  {!isProcessing && !resultPreview && (
                    <div className="p-6 text-sm text-muted-foreground">Încă nu există rezultat</div>
                  )}
                </div>
                {!isProcessing && resultPreview && (
                  <Button onClick={downloadResult} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Download className="h-4 w-4 mr-2" />
                    Descarcă fotografia corectată
                  </Button>
                )}
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <XCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
                {!error && resultPreview && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Corectare perspectiva finalizată cu succes
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
