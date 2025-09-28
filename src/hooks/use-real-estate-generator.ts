'use client'

import { useState, useCallback } from 'react'
import { PropertyDetails, AdGenerationRequest, AdGenerationResponse } from '@/types'
import { realEstateApi, mockApi } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

export function useRealEstateGenerator() {
  const [property, setProperty] = useState<PropertyDetails>({
    location: '',
    size: '',
    price: '',
    rooms: '',
    amenities: [],
    propertyType: 'apartment',
    condition: 'good'
  })
  
  const [keywords, setKeywords] = useState<string[]>([])
  const [wordLimit, setWordLimit] = useState(150)
  const [tone, setTone] = useState<'professional' | 'persuasive' | 'friendly'>('professional')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAds, setGeneratedAds] = useState<AdGenerationResponse[]>([])
  const { toast } = useToast()

  const updateProperty = useCallback((updates: Partial<PropertyDetails>) => {
    setProperty(prev => ({ ...prev, ...updates }))
  }, [])

  const addKeyword = useCallback((keyword: string) => {
    if (keyword.trim() && !keywords.includes(keyword.trim())) {
      setKeywords(prev => [...prev, keyword.trim()])
    }
  }, [keywords])

  const removeKeyword = useCallback((keyword: string) => {
    setKeywords(prev => prev.filter(k => k !== keyword))
  }, [])

  const toggleAmenity = useCallback((amenity: string) => {
    setProperty(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }, [])

  const generateAd = useCallback(async () => {
    if (!property.location || !property.size || !property.price) {
      toast({
        title: "Missing information",
        description: "Please fill in location, size, and price fields.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)

    try {
      const request: AdGenerationRequest = {
        property,
        keywords,
        wordLimit,
        tone
      }

      // Use mock API for development
      const response = await mockApi.generateAd(request)

      if (response.success && response.data) {
        setGeneratedAds(prev => [response.data!, ...prev])

        toast({
          title: "Ad generated successfully",
          description: "Your Romanian real estate ad is ready!",
        })
      } else {
        throw new Error(response.error || 'Generation failed')
      }

    } catch (error) {
      toast({
        title: "Generation failed",
        description: "There was an error generating your ad. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }, [property, keywords, wordLimit, tone, toast])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The ad text has been copied to your clipboard.",
    })
  }, [toast])

  const downloadAd = useCallback((ad: AdGenerationResponse) => {
    const blob = new Blob([ad.adText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `real-estate-ad-${ad.id}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const clearGeneratedAds = useCallback(() => {
    setGeneratedAds([])
  }, [])

  const resetForm = useCallback(() => {
    setProperty({
      location: '',
      size: '',
      price: '',
      rooms: '',
      amenities: [],
      propertyType: 'apartment',
      condition: 'good'
    })
    setKeywords([])
    setWordLimit(150)
    setTone('professional')
  }, [])

  return {
    // State
    property,
    keywords,
    wordLimit,
    tone,
    isGenerating,
    generatedAds,
    
    // Actions
    updateProperty,
    addKeyword,
    removeKeyword,
    toggleAmenity,
    setWordLimit,
    setTone,
    generateAd,
    copyToClipboard,
    downloadAd,
    clearGeneratedAds,
    resetForm
  }
}

