'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Image as ImageIcon, CheckCircle, XCircle, Loader2, Download, Wand2, Settings } from 'lucide-react'

export function ImageEditor() {
  const [sourcePreview, setSourcePreview] = useState<string | null>(null)
  const [resultPreview, setResultPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [extendPrompt, setExtendPrompt] = useState('Extend the image outward with matching background and seamless continuation')
  const [isExtending, setIsExtending] = useState(false)
  const [extendedPreview, setExtendedPreview] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles?.[0]
    if (!file) return

    setError(null)
    setResultPreview(null)
    setExtendedPreview(null)
    setCurrentFile(file)
    setSourcePreview(URL.createObjectURL(file))
    setIsProcessing(true)

    try {
      // Process image using Canvas API
      const processedImageUrl = await processImageWithCanvas(file)
      setResultPreview(processedImageUrl)
    } catch (e: any) {
      setError(e?.message || 'Image edit failed')
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const processImageWithCanvas = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }

          canvas.width = img.width
          canvas.height = img.height

          // Draw the original image
          ctx.drawImage(img, 0, 0)

          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data

          // Apply saturation (+35%) and contrast (+10%) adjustments using simpler, more reliable method
          for (let i = 0; i < data.length; i += 4) {
            let r = data[i]
            let g = data[i + 1]
            let b = data[i + 2]

            // Apply saturation adjustment (+35%) using a simpler method
            const gray = 0.299 * r + 0.587 * g + 0.114 * b // Calculate luminance
            const saturationFactor = 1.35
            
            r = Math.min(255, Math.max(0, gray + (r - gray) * saturationFactor))
            g = Math.min(255, Math.max(0, gray + (g - gray) * saturationFactor))
            b = Math.min(255, Math.max(0, gray + (b - gray) * saturationFactor))
            
            // Apply contrast adjustment (+10%) using simple linear scaling
            const contrast = 1.10
            r = Math.min(255, Math.max(0, (r - 128) * contrast + 128))
            g = Math.min(255, Math.max(0, (g - 128) * contrast + 128))
            b = Math.min(255, Math.max(0, (b - 128) * contrast + 128))
            
            data[i] = r
            data[i + 1] = g
            data[i + 2] = b
          }

          // Put the modified image data back
          ctx.putImageData(imageData, 0, 0)

          // Convert canvas to blob and create URL
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(URL.createObjectURL(blob))
            } else {
              reject(new Error('Failed to create blob from canvas'))
            }
          }, file.type || 'image/png')
        } catch (error) {
          reject(error)
        }
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: false
  })

  const extendImageWithAI = async () => {
    if (!currentFile) return

    setIsExtending(true)
    setError(null)

    try {
      console.log('🤖 Starting AI image extension...')
      
      const formData = new FormData()
      formData.append('image', currentFile)
      formData.append('prompt', extendPrompt)

      const response = await fetch('/api/extend-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`AI extension failed: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'AI extension failed')
      }

      console.log('✅ AI extension completed successfully')
      setExtendedPreview(result.extendedImage)
    } catch (e: any) {
      console.error('❌ AI extension error:', e)
      setError(e?.message || 'AI extension failed')
    } finally {
      setIsExtending(false)
    }
  }

  const downloadResult = () => {
    if (!resultPreview) return
    const a = document.createElement('a')
    a.href = resultPreview
    a.download = 'image-edited.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const downloadExtended = () => {
    if (!extendedPreview) return
    const a = document.createElement('a')
    a.href = extendedPreview
    a.download = 'image-extended.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Editor Imagini
          </CardTitle>
          <CardDescription>
            Trageți și plasați o imagine. Aplicăm +35% saturație și +10% contrast folosind procesare client-side. 
            Opțional: extindeți imaginea cu AI pentru a umple spațiile goale.
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
                  {isDragActive ? 'Plasați imaginea aici' : 'Încărcați imaginea'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Acceptă PNG, JPG, JPEG, WEBP
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
                <p className="text-sm text-muted-foreground">Original</p>
                <div className="border rounded-lg overflow-hidden">
                  {sourcePreview ? (
                    <img src={sourcePreview} alt="original" className="w-full h-auto" />
                  ) : (
                    <div className="p-6 text-sm text-muted-foreground">Nicio imagine</div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Rezultat</p>
                <div className="border rounded-lg overflow-hidden min-h-[120px] flex items-center justify-center">
                  {isProcessing && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Se procesează...
                    </div>
                  )}
                  {!isProcessing && resultPreview && (
                    <img src={resultPreview} alt="rezultat" className="w-full h-auto" />
                  )}
                  {!isProcessing && !resultPreview && (
                    <div className="p-6 text-sm text-muted-foreground">Încă nu există rezultat</div>
                  )}
                </div>
                {!isProcessing && resultPreview && (
                  <Button onClick={downloadResult} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Download className="h-4 w-4 mr-2" />
                    Descarcă rezultatul
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
                    Editare finalizată cu succes
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {sourcePreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Extindere AI
            </CardTitle>
            <CardDescription>
              Extindeți imaginea cu AI pentru a umple spațiile goale și a crea o continuare naturală
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt pentru extindere:</label>
              <Input
                value={extendPrompt}
                onChange={(e) => setExtendPrompt(e.target.value)}
                placeholder="Descrieți cum să fie extinsă imaginea..."
                className="w-full"
              />
            </div>
            
            <Button 
              onClick={extendImageWithAI} 
              disabled={isExtending || !currentFile}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isExtending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Se extinde cu AI...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Extinde imaginea cu AI
                </>
              )}
            </Button>

            {extendedPreview && (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <img src={extendedPreview} alt="extended" className="w-full h-auto" />
                </div>
                <Button onClick={downloadExtended} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Download className="h-4 w-4 mr-2" />
                  Descarcă imaginea extinsă
                </Button>
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Extindere AI finalizată cu succes
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}



