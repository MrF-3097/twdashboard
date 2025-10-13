'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { DocumentConverter } from '@/components/modules/document-converter'
import { RealEstateGenerator } from '@/components/modules/real-estate-generator'
import { PrinterDriver } from '@/components/modules/printer-driver'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Building2, Printer, Sparkles, RotateCcw, TrendingUp, Wand2 } from 'lucide-react'
import { ImageEditor } from '@/components/modules/image-editor'
import { AutoAngleFixer } from '@/components/modules/auto-angle-fixer'
import { AgentRanking } from '@/components/modules/agent-ranking'
import { PhotoFixer } from '@/components/modules/photo-fixer'

// Typing Animation Component
function TypingAnimation() {
  const [displayText, setDisplayText] = useState('')
  const fullText = 'Bună, cu ce te pot ajuta astăzi?'
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + fullText[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, 100) // Typing speed: 100ms per character

      return () => clearTimeout(timeout)
    } else if (currentIndex === fullText.length) {
      setIsComplete(true)
    }
  }, [currentIndex, fullText])

  return (
    <span>
      {displayText}
      {!isComplete && <span className="animate-pulse">|</span>}
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
            Bună, cu ce te pot ajuta astăzi?
          </h1>
          <p className="mx-auto max-w-2xl text-sm md:text-lg text-muted-foreground">
            Optimizați-vă fluxul de lucru cu instrumente puternice de conversie documente, 
            anunțuri imobiliare generate de AI, editare imagini și corectare perspectivă automată cu AI extension.
          </p>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-8 relative overflow-hidden">
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
            <TabsTrigger 
              value="image-editor" 
              className="flex items-center gap-1 md:gap-2 relative z-10 transition-all duration-300 ease-in-out hover:scale-105"
            >
              <svg className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              <span className="hidden md:inline">Editor Imagini</span>
              <span className="md:hidden text-xs">Imagini</span>
            </TabsTrigger>
            <TabsTrigger 
              value="auto-angle-fixer" 
              className="flex items-center gap-1 md:gap-2 relative z-10 transition-all duration-300 ease-in-out hover:scale-105"
            >
              <RotateCcw className="h-4 w-4 md:h-5 md:w-5 transition-transform duration-300" />
              <span className="hidden md:inline">Corector Perspectivă</span>
              <span className="md:hidden text-xs">Perspectivă</span>
            </TabsTrigger>
            <TabsTrigger 
              value="agent-ranking" 
              className="flex items-center gap-1 md:gap-2 relative z-10 transition-all duration-300 ease-in-out hover:scale-105"
            >
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 transition-transform duration-300" />
              <span className="hidden md:inline">Agent Ranking</span>
              <span className="md:hidden text-xs">Ranking</span>
            </TabsTrigger>
            <TabsTrigger 
              value="photo-fixer" 
              className="flex items-center gap-1 md:gap-2 relative z-10 transition-all duration-300 ease-in-out hover:scale-105"
            >
              <Wand2 className="h-4 w-4 md:h-5 md:w-5 transition-transform duration-300" />
              <span className="hidden md:inline">Photo Fixer</span>
              <span className="md:hidden text-xs">Fixer</span>
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

          <TabsContent 
            value="image-editor" 
            className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          >
            <Card className="transform transition-all duration-500 hover:shadow-lg hover:scale-[1.02]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  Editor Imagini
                </CardTitle>
                <CardDescription>
                  Editați imaginile rapid (+35% saturație, +10% contrast) folosind procesare client-side
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageEditor />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent 
            value="auto-angle-fixer" 
            className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          >
            <Card className="transform transition-all duration-500 hover:shadow-lg hover:scale-[1.02]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
                  Auto Angle Fixer
                </CardTitle>
                <CardDescription>
                  Corectați automat perspectiva fotografiilor imobiliare cu AI extension pentru umplerea zonelor goale
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AutoAngleFixer />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent 
            value="agent-ranking" 
            className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          >
            <Card className="transform transition-all duration-500 hover:shadow-lg hover:scale-[1.02]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
                  Agent Ranking
                </CardTitle>
                <CardDescription>
                  Sistem de ranking agenți pentru evaluare performanță
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AgentRanking />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent 
            value="photo-fixer" 
            className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          >
            <Card className="transform transition-all duration-500 hover:shadow-lg hover:scale-[1.02]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
                  Photo Fixer - Corector Automat Fotografii
                </CardTitle>
                <CardDescription>
                  Corectare automată a înclinării și expansiune inteligentă pentru fotografii imobiliare
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PhotoFixer />
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>

      <Footer />
    </div>
  )
}
