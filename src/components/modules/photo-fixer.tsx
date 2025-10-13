'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { 
  Upload, 
  Loader2, 
  Download,
  RefreshCcw,
  CheckCircle,
  Image as ImageIcon,
  Wand2
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function PhotoFixer() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [fixedImage, setFixedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileName, setFileName] = useState<string>('')
  const [expansionPercent, setExpansionPercent] = useState<string>('20')
  const [rotationAngle, setRotationAngle] = useState<number>(0)
  const [processingTime, setProcessingTime] = useState<number>(0)
  const { toast } = useToast()

  const handleFixPhoto = async () => {
    if (!originalImage) {
      toast({
        title: "No image selected",
        description: "Please upload an image first.",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    const startTime = Date.now()

    try {
      // Convert base64 to blob
      const response = await fetch(originalImage)
      const blob = await response.blob()
      
      // Create form data
      const formData = new FormData()
      formData.append('image', blob, fileName)
      formData.append('expansionPercent', expansionPercent)
      formData.append('angle', rotationAngle.toString())
      formData.append('autoDetectAngle', 'false')

      // Call the fix-photo API
      const apiResponse = await fetch('/api/fix-photo', {
        method: 'POST',
        body: formData
      })

      const result = await apiResponse.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fix photo')
      }

      setFixedImage(result.fixedImage)
      setProcessingTime(Date.now() - startTime)

      toast({
        title: "Photo fixed successfully!",
        description: `Processed in ${((Date.now() - startTime) / 1000).toFixed(1)}s. Rotation: ${rotationAngle}°, Zoom: 35%, Expansion: ${expansionPercent}%`,
      })

    } catch (error) {
      console.error('Photo fixing error:', error)
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to fix photo",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string)
        setFixedImage(null) // Reset fixed image when new image is uploaded
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  })

  const handleDownload = () => {
    if (!fixedImage) return

    const link = document.createElement('a')
    link.href = fixedImage
    link.download = `fixed-${fileName}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Downloaded",
      description: "Fixed photo has been downloaded.",
    })
  }

  const handleReset = () => {
    setOriginalImage(null)
    setFixedImage(null)
    setFileName('')
    setProcessingTime(0)
    setRotationAngle(0)
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Încarcă Fotografie
          </CardTitle>
          <CardDescription>
            Încarcați o fotografie imobiliară pentru corectare automată
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-sm text-muted-foreground">Eliberați pentru a încărca...</p>
            ) : (
              <div>
                <p className="text-sm font-medium mb-2">
                  Trageți și plasați o imagine aici sau faceți clic pentru a selecta
                </p>
                <p className="text-xs text-muted-foreground">
                  Acceptă: JPG, PNG, WEBP
                </p>
              </div>
            )}
          </div>

          {/* Rotation Angle Control */}
          <div className="mt-4 space-y-2">
            <Label>Unghi Rotație: {rotationAngle}°</Label>
            <input
              type="range"
              min="-10"
              max="10"
              step="0.5"
              value={rotationAngle}
              onChange={(e) => setRotationAngle(parseFloat(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>-10° (stânga)</span>
              <span>0° (drept)</span>
              <span>+10° (dreapta)</span>
            </div>
          </div>

          {/* Expansion Control */}
          <div className="mt-4 space-y-2">
            <Label>Expansiune Margini</Label>
            <Select value={expansionPercent} onValueChange={setExpansionPercent}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15% Expansiune</SelectItem>
                <SelectItem value="20">20% Expansiune (Recomandat)</SelectItem>
                <SelectItem value="25">25% Expansiune</SelectItem>
                <SelectItem value="30">30% Expansiune</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Proces: Rotație → Zoom 35% → Recadare → Expansiune {expansionPercent}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {originalImage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="h-5 w-5" />
                Original
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={originalImage}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
              </div>
            </CardContent>
          </Card>

          {/* Fixed Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {fixedImage ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Corectat
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5" />
                    Rezultat
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                {fixedImage ? (
                  <img
                    src={fixedImage}
                    alt="Fixed"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Wand2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Apăsați "Corectează Fotografia" pentru a procesa</p>
                    </div>
                  </div>
                )}
              </div>
              {fixedImage && processingTime > 0 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Procesat în {(processingTime / 1000).toFixed(1)} secunde
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      {originalImage && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleFixPhoto}
                disabled={isProcessing}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Se procesează...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Corectează Fotografia
                  </>
                )}
              </Button>

              {fixedImage && (
                <>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descarcă
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="lg"
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Resetează
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Cum Funcționează</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
              1
            </div>
            <div>
              <p className="font-medium">Ajustare Manuală Unghi</p>
              <p className="text-sm text-muted-foreground">
                Utilizați sliderul pentru a selecta unghiul de rotație (de obicei 2-5° pentru fotografii înclinată)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
              2
            </div>
            <div>
              <p className="font-medium">Rotație Precisă</p>
              <p className="text-sm text-muted-foreground">
                Imaginea este rotată exact cu unghiul specificat pentru corectarea perspectivei
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
              3
            </div>
            <div>
              <p className="font-medium">Zoom Inteligent 35%</p>
              <p className="text-sm text-muted-foreground">
                Zoom automat în conținut și recadare centrată pentru eliminarea completă a spațiilor goale
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
              4
            </div>
            <div>
              <p className="font-medium">Expansiune Opțională</p>
              <p className="text-sm text-muted-foreground">
                Mărire adițională cu {expansionPercent}% pentru rezultate mai mari (opțional)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

