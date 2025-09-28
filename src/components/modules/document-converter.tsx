'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/modal'
import { 
  FileText, 
  File,
  ExternalLink,
  ArrowRightLeft
} from 'lucide-react'

export function DocumentConverter() {
  const [selectedConversion, setSelectedConversion] = useState<'docx-to-pdf' | 'pdf-to-docx' | null>(null)

  const openILovePDF = (conversionType: 'docx-to-pdf' | 'pdf-to-docx') => {
    setSelectedConversion(conversionType)
    
    let url = ''
    if (conversionType === 'docx-to-pdf') {
      url = 'https://www.ilovepdf.com/word_to_pdf'
    } else {
      url = 'https://www.ilovepdf.com/pdf_to_word'
    }
    
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-6">
      {/* Conversion Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DOCX to PDF */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              DOCX → PDF
            </CardTitle>
            <CardDescription>
              Convertește documentele Word în PDF
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  size="lg"
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Convertește DOCX în PDF
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Convertește DOCX în PDF</DialogTitle>
                  <DialogDescription>
                    Veți fi redirecționat către ILOVEPDF pentru a converti documentul dvs.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">ILOVEPDF - Word to PDF</p>
                      <p className="text-sm text-muted-foreground">
                        Serviciu profesional de conversie documente
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => openILovePDF('docx-to-pdf')}
                      className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Deschide ILOVEPDF
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* PDF to DOCX */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              PDF → DOCX
            </CardTitle>
            <CardDescription>
              Convertește PDF-urile în documente Word editabile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  size="lg"
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Convertește PDF în DOCX
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Convertește PDF în DOCX</DialogTitle>
                  <DialogDescription>
                    Veți fi redirecționat către ILOVEPDF pentru a converti documentul dvs.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <File className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">ILOVEPDF - PDF to Word</p>
                      <p className="text-sm text-muted-foreground">
                        Serviciu profesional de conversie documente
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => openILovePDF('pdf-to-docx')}
                      className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Deschide ILOVEPDF
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

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
              <p className="font-medium">Alegeți tipul de conversie</p>
              <p className="text-sm text-muted-foreground">
                Faceți clic pe butonul pentru conversia dorită (DOCX → PDF sau PDF → DOCX)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
              2
            </div>
            <div>
              <p className="font-medium">Încărcați documentul</p>
              <p className="text-sm text-muted-foreground">
                Pe ILOVEPDF, încărcați documentul dvs. și așteptați conversia
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
                Descărcați documentul convertit cu formatarea perfectă păstrată
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
