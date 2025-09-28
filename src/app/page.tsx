'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { DocumentConverter } from '@/components/modules/document-converter'
import { RealEstateGenerator } from '@/components/modules/real-estate-generator'
import { PrinterDriver } from '@/components/modules/printer-driver'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Building2, Printer, Sparkles } from 'lucide-react'

// Typing Animation Component
function TypingAnimation() {
  const [displayText, setDisplayText] = useState('')
  const fullText = 'Bună, cu ce te pot ajuta astăzi?'
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + fullText[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, 100) // Typing speed: 100ms per character

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, fullText])

  return (
    <span>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-2 md:px-4 py-4 md:py-8">
        {/* Hero Section */}
        <div className="mb-6 md:mb-8 text-center px-4">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full bg-secondary/20 shadow-lg">
              <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
          </div>
          <h1 className="mb-4 text-2xl md:text-4xl font-bold tracking-tight text-primary">
            <TypingAnimation />
          </h1>
          <p className="mx-auto max-w-2xl text-sm md:text-lg text-muted-foreground">
            Optimizați-vă fluxul de lucru cu instrumente puternice de conversie documente, 
            anunțuri imobiliare generate de AI și gestionarea driverelor de imprimantă.
          </p>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 relative overflow-hidden">
            <TabsTrigger 
              value="documents" 
              className="flex items-center gap-1 md:gap-2 relative z-10 transition-all duration-300 ease-in-out hover:scale-105"
            >
              <FileText className="h-4 w-4 md:h-5 md:w-5 transition-transform duration-300" />
              <span className="hidden md:inline">Convertor Documente</span>
              <span className="md:hidden text-xs">Documente</span>
            </TabsTrigger>
            <TabsTrigger 
              value="real-estate" 
              className="flex items-center gap-1 md:gap-2 relative z-10 transition-all duration-300 ease-in-out hover:scale-105"
            >
              <Building2 className="h-4 w-4 md:h-5 md:w-5 transition-transform duration-300" />
              <span className="hidden md:inline">Anunțuri Imobiliare</span>
              <span className="md:hidden text-xs">Imobiliare</span>
            </TabsTrigger>
            <TabsTrigger 
              value="printer" 
              className="flex items-center gap-1 md:gap-2 relative z-10 transition-all duration-300 ease-in-out hover:scale-105"
            >
              <Printer className="h-4 w-4 md:h-5 md:w-5 transition-transform duration-300" />
              <span className="hidden md:inline">Driver Imprimantă</span>
              <span className="md:hidden text-xs">Driver</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent 
            value="documents" 
            className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          >
            <Card className="transform transition-all duration-500 hover:shadow-lg hover:scale-[1.02]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
                  Convertor Documente
                </CardTitle>
                <CardDescription>
                  Convertiți între formatele DOCX și PDF păstrând formatarea perfectă
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentConverter />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent 
            value="real-estate" 
            className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          >
            <Card className="transform transition-all duration-500 hover:shadow-lg hover:scale-[1.02]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
                  Generator Anunțuri Imobiliare cu AI
                </CardTitle>
                <CardDescription>
                  Generați anunțuri imobiliare profesionale în română cu inteligența artificială
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RealEstateGenerator />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent 
            value="printer" 
            className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          >
            <Card className="transform transition-all duration-500 hover:shadow-lg hover:scale-[1.02]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
                  Descărcări Driver Imprimantă
                </CardTitle>
                <CardDescription>
                  Obțineți driverul potrivit pentru sistemul dvs. de operare
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PrinterDriver />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  )
}
