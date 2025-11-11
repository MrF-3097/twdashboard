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
import { useToast } from '@/components/ui/use-toast'
import { 
  FileText, 
  File,
  ExternalLink,
  ArrowRightLeft,
  Download
} from 'lucide-react'

export function DocumentConverter() {
  const [selectedConversion, setSelectedConversion] = useState<'docx-to-pdf' | 'pdf-to-docx' | null>(null)
  const { toast } = useToast()

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

  const handleContractDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Descărcare inițiată",
      description: `Descărcarea ${fileName} a fost inițiată.`,
    })
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
                  className="w-full bg-gradient-to-br from-[#74070e] to-[#A0151E] hover:from-[#A0151E] hover:to-[#C92A2F] text-white shadow-lg"
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
                    <FileText className="h-8 w-8 text-[#74070e]" />
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
                      className="flex-1 bg-gradient-to-br from-[#74070e] to-[#A0151E] hover:from-[#A0151E] hover:to-[#C92A2F] text-white shadow-lg"
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
                  className="w-full bg-gradient-to-br from-[#74070e] to-[#A0151E] hover:from-[#A0151E] hover:to-[#C92A2F] text-white shadow-lg"
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
                    <File className="h-8 w-8 text-[#74070e]" />
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
                      className="flex-1 bg-gradient-to-br from-[#74070e] to-[#A0151E] hover:from-[#A0151E] hover:to-[#C92A2F] text-white shadow-lg"
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

      {/* Contract Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Șabloane Contracte Tower Imob
          </CardTitle>
          <CardDescription>
            Descărcați șabloanele de contracte pentru documentele dvs. imobiliare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Contract CERERE */}
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#74070e]/10 flex-shrink-0">
                    <FileText className="h-5 w-5 text-[#74070e]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">Contracte CERERE Tower Imob</h3>
                    <p className="text-sm text-muted-foreground">
                      Șabloane pentru contracte de cerere și aplicații imobiliare
                    </p>
                  </div>
                </div>
                <div className="flex justify-end sm:justify-start">
                  <Button
                    size="sm"
                    onClick={() => handleContractDownload(
                      '/Contracte CERERE Tower Imob 22.09.2023-20251017T085909Z-1-001.zip',
                      'Contracte-CERERE-Tower-Imob.zip'
                    )}
                    className="flex items-center gap-2 bg-gradient-to-br from-[#74070e] to-[#A0151E] hover:from-[#A0151E] hover:to-[#C92A2F] text-white w-full sm:w-auto shadow-lg"
                  >
                    <Download className="h-3 w-3" />
                    <span className="hidden sm:inline">Descarcă Contracte CERERE</span>
                    <span className="sm:hidden">Descarcă</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Contract VÂNZARE-ÎNCHIRIERE */}
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#74070e]/10 flex-shrink-0">
                    <FileText className="h-5 w-5 text-[#74070e]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">Contracte VÂNZARE-ÎNCHIRIERE</h3>
                    <p className="text-sm text-muted-foreground">
                      Șabloane pentru contracte de vânzare și închiriere imobiliară
                    </p>
                  </div>
                </div>
                <div className="flex justify-end sm:justify-start">
                  <Button
                    size="sm"
                    onClick={() => handleContractDownload(
                      '/Contracte VÂNZARE-ÎNCHIRIERE 22.09.2023-20251017T085901Z-1-001.zip',
                      'Contracte-VANZARE-INCHIRIERE.zip'
                    )}
                    className="flex items-center gap-2 bg-gradient-to-br from-[#74070e] to-[#A0151E] hover:from-[#A0151E] hover:to-[#C92A2F] text-white w-full sm:w-auto shadow-lg"
                  >
                    <Download className="h-3 w-3" />
                    <span className="hidden sm:inline">Descarcă Contracte VÂNZARE</span>
                    <span className="sm:hidden">Descarcă</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Cum funcționează</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#74070e]/10 text-[#74070e] text-sm font-medium">
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
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#74070e]/10 text-[#74070e] text-sm font-medium">
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
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#74070e]/10 text-[#74070e] text-sm font-medium">
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
