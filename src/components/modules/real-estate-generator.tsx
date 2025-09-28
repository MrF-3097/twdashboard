'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import { 
  Building2, 
  MapPin, 
  Euro, 
  Sparkles, 
  Copy, 
  Download,
  Loader2,
  CheckCircle,
  FileText
} from 'lucide-react'
import { AdGenerationRequest, AdGenerationResponse } from '@/types'

export function RealEstateGenerator() {
  const [propertyType, setPropertyType] = useState<'apartment' | 'house' | 'commercial' | 'land'>('apartment')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [tone, setTone] = useState<'professional' | 'persuasive' | 'friendly'>('professional')
  const [propertyDetails, setPropertyDetails] = useState('')
  const [aiRules, setAiRules] = useState(`Reguli pentru generarea anunțurilor imobiliare:

1. Întotdeauna menționează că proprietatea este o oportunitate excelentă de investiție
2. Includeți informații despre transportul public și accesibilitate
3. Menționați siguranța zonei și vecinătatea
4. Adăugați detalii despre potențialul de apreciere a valorii
5. Folosiți cuvinte cheie: "excepțional", "unic", "rar", "oportunitate"
6. Întotdeauna includeți un apel la acțiune pentru contact
7. Menționați că vizionarea este disponibilă imediat
8. Evidențiați avantajele financiare (chirie, investiție, etc.)
9. IMPORTANT: Începeți întotdeauna cu "Tower Imob va prezinta..."`)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAds, setGeneratedAds] = useState<AdGenerationResponse[]>([])
  const { toast } = useToast()


  const generateAd = async () => {
    if (!location || !price || !propertyDetails.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in location, price, and property details fields.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)

    try {
      const request: AdGenerationRequest = {
        property: {
          location,
          price,
          propertyType,
          details: propertyDetails
        },
        tone,
        aiRules
      }

      // Call the real API
      const response = await fetch('/api/real-estate/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })
      
      const result = await response.json()
      
      // Debug logging
      console.log('API Response:', result)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate ad')
      }
      
      const mockResponse: AdGenerationResponse = result.data
      
      // Debug logging
      console.log('Generated ad:', mockResponse)

      setGeneratedAds(prev => [mockResponse, ...prev])

      toast({
        title: "Ad generated successfully",
        description: "Your Romanian real estate ad is ready!",
      })

    } catch (error) {
      toast({
        title: "Generation failed",
        description: "There was an error generating your ad. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The ad text has been copied to your clipboard.",
    })
  }

  const downloadAd = (ad: AdGenerationResponse) => {
    const blob = new Blob([ad.adText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `real-estate-ad-${ad.id}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informații Proprietate
            </CardTitle>
            <CardDescription>
              Introduceți informațiile de bază despre proprietate pentru generarea anunțului
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Property Type */}
            <div className="space-y-2">
              <Label>Tip Proprietate</Label>
              <Select
                value={propertyType}
                onValueChange={(value: any) => setPropertyType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartament</SelectItem>
                  <SelectItem value="house">Casă</SelectItem>
                  <SelectItem value="commercial">Comercial</SelectItem>
                  <SelectItem value="land">Teren</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Locația *
              </Label>
              <Input
                id="location"
                placeholder="ex: București, Sector 1"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Prețul *
              </Label>
              <Input
                id="price"
                placeholder="ex: 120,000 EUR"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <Label>Tonul</Label>
              <Select value={tone} onValueChange={(value: any) => setTone(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Profesional</SelectItem>
                  <SelectItem value="persuasive">Persuasiv</SelectItem>
                  <SelectItem value="friendly">Prietenos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalii Proprietate
            </CardTitle>
            <CardDescription>
              Adăugați orice informație pe care doriți să o includeți în descriere
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="ex: 3 camere, 300 euro chirie, balcon, etaj 4, centrală termică, parcare, lift..."
                value={propertyDetails}
                onChange={(e) => setPropertyDetails(e.target.value)}
                className="min-h-32"
              />
              <p className="text-sm text-muted-foreground">
                Exemplu: "3 camere, 300 euro chirie, balcon, etaj 4, centrală termică, parcare, lift"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Reguli AI & Instrucțiuni
            </CardTitle>
            <CardDescription>
              Personalizați modul în care AI-ul generează descrierile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Introduceți regulile personalizate pentru generarea AI..."
                value={aiRules}
                onChange={(e) => setAiRules(e.target.value)}
                className="min-h-32"
              />
              <p className="text-sm text-muted-foreground">
                Aceste reguli vor ghida AI-ul în generarea descrierilor proprietăților.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={generateAd} 
              disabled={isGenerating}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Se generează...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generează Anunț Română
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Generated Ads */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Anunțuri Generate
            </CardTitle>
            <CardDescription>
              Anunțurile dvs. imobiliare românești generate de AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedAds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nu au fost generate anunțuri încă</p>
                <p className="text-sm">Completați formularul și faceți clic pe "Generează Anunț Română"</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {generatedAds.map((ad) => (
                    <Card key={ad.id} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              Generated {new Date(ad.generatedAt).toLocaleTimeString()}
                            </span>
                            <span className="text-xs bg-muted px-2 py-1 rounded">
                              {ad.wordCount} words
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(ad.adText)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-accent hover:bg-accent/90 text-accent-foreground"
                              onClick={() => downloadAd(ad)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Textarea
                            value={ad.adText}
                            readOnly
                            className="min-h-32 text-sm"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
