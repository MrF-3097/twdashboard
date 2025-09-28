'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import { 
  Upload, 
  Download, 
  FileText, 
  File, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ArrowRightLeft
} from 'lucide-react'
import { formatFileSize, validateFileType } from '@/lib/utils'
import { DocumentConversion, ConversionStatus } from '@/types'

export function DocumentConverter() {
  const [conversions, setConversions] = useState<DocumentConversion[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  // File upload handler with drag & drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/pdf'
      ]
      
      if (!validateFileType(file, allowedTypes)) {
        toast({
          title: "Tip de fișier invalid",
          description: "Vă rugăm să încărcați doar fișiere DOCX sau PDF.",
          variant: "destructive"
        })
        continue
      }

      // Determine conversion type
      const fromFormat = file.type.includes('pdf') ? 'pdf' : 'docx'
      const toFormat = fromFormat === 'pdf' ? 'docx' : 'pdf'

      // Create conversion record
      const conversion: DocumentConversion = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        fileName: file.name,
        fileSize: file.size,
        fromFormat,
        toFormat,
        status: {
          id: Date.now().toString(),
          status: 'pending',
          progress: 0
        },
        uploadedAt: new Date()
      }

      setConversions(prev => [conversion, ...prev])
      
      // Start conversion process
      await processConversion(conversion, file)
    }
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/pdf': ['.pdf']
    },
    multiple: true
  })

  // Simulate conversion process
  const processConversion = async (conversion: DocumentConversion, file: File) => {
    setIsProcessing(true)
    
    try {
      // Update status to processing
      setConversions(prev => prev.map(c => 
        c.id === conversion.id 
          ? { ...c, status: { ...c.status, status: 'processing', progress: 0 } }
          : c
      ))

      // Simulate progress updates
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setConversions(prev => prev.map(c => 
          c.id === conversion.id 
            ? { ...c, status: { ...c.status, progress } }
            : c
        ))
      }

      // Simulate API call to backend
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fromFormat', conversion.fromFormat)
      formData.append('toFormat', conversion.toFormat)

      // TODO: Replace with actual API call
      // const response = await fetch('/api/convert-document', {
      //   method: 'POST',
      //   body: formData
      // })
      
      // Simulate successful conversion
      const downloadUrl = URL.createObjectURL(file) // In real app, this would be from API
      
      setConversions(prev => prev.map(c => 
        c.id === conversion.id 
          ? { 
              ...c, 
              status: { 
                ...c.status, 
                status: 'completed', 
                progress: 100,
                downloadUrl,
                message: 'Conversia s-a finalizat cu succes'
              } 
            }
          : c
      ))

      toast({
        title: "Conversie finalizată",
        description: `${conversion.fileName} a fost convertit în ${conversion.toFormat.toUpperCase()}`,
      })

    } catch (error) {
      setConversions(prev => prev.map(c => 
        c.id === conversion.id 
          ? { 
              ...c, 
              status: { 
                ...c.status, 
                status: 'error', 
                message: 'Conversia a eșuat. Vă rugăm să încercați din nou.'
              } 
            }
          : c
      ))

      toast({
        title: "Conversie eșuată",
        description: "A apărut o eroare la conversia documentului. Vă rugăm să încercați din nou.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadFile = (conversion: DocumentConversion) => {
    if (conversion.status.downloadUrl) {
      const link = document.createElement('a')
      link.href = conversion.status.downloadUrl
      link.download = conversion.fileName.replace(/\.[^/.]+$/, `.${conversion.toFormat}`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const getStatusIcon = (status: ConversionStatus) => {
    switch (status.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <File className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: ConversionStatus) => {
    switch (status.status) {
      case 'completed':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'processing':
        return 'text-blue-600'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Încărcare Documente
          </CardTitle>
          <CardDescription>
            Trageți și plasați fișierele DOCX sau PDF aici, sau faceți clic pentru a selecta fișiere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isDragActive ? 'Plasați fișierele aici' : 'Încărcați documentele'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Suportă fișiere DOCX și PDF până la 10MB
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Queue */}
      {conversions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Coada de Conversii
            </CardTitle>
            <CardDescription>
              Urmăriți conversiile documentelor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {conversions.map((conversion) => (
                  <div
                    key={conversion.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {getStatusIcon(conversion.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{conversion.fileName}</span>
                          <span className="text-sm text-muted-foreground">
                            ({formatFileSize(conversion.fileSize)})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="uppercase font-mono bg-muted px-2 py-1 rounded">
                            {conversion.fromFormat}
                          </span>
                          <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                          <span className="uppercase font-mono bg-muted px-2 py-1 rounded">
                            {conversion.toFormat}
                          </span>
                        </div>
                        {conversion.status.status === 'processing' && (
                          <div className="mt-2">
                            <Progress 
                              value={conversion.status.progress} 
                              className="h-2"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {conversion.status.progress}% finalizat
                            </p>
                          </div>
                        )}
                        {conversion.status.message && (
                          <p className={`text-sm mt-1 ${getStatusColor(conversion.status)}`}>
                            {conversion.status.message}
                          </p>
                        )}
                      </div>
                    </div>
                    {conversion.status.status === 'completed' && (
                      <Button
                        onClick={() => downloadFile(conversion)}
                        size="sm"
                        className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                      >
                        <Download className="h-4 w-4" />
                        Descarcă
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Cum funcționează</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
              1
            </div>
            <div>
              <p className="font-medium">Încărcați documentul</p>
              <p className="text-sm text-muted-foreground">
                Trageți și plasați sau faceți clic pentru a selecta fișiere DOCX sau PDF
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
              2
            </div>
            <div>
              <p className="font-medium">Conversie automată</p>
              <p className="text-sm text-muted-foreground">
                Sistemul nostru convertește documentul păstrând formatarea
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
              3
            </div>
            <div>
              <p className="font-medium">Descărcați rezultatul</p>
              <p className="text-sm text-muted-foreground">
                Obțineți documentul convertit cu formatarea perfectă păstrată
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
