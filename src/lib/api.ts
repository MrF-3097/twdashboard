import { ApiResponse, DocumentConversion, AdGenerationRequest, AdGenerationResponse } from '@/types'

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('API request failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Document conversion API
export const documentApi = {
  // Convert document (DOCX ↔ PDF)
  async convertDocument(
    file: File,
    fromFormat: 'docx' | 'pdf',
    toFormat: 'docx' | 'pdf'
  ): Promise<ApiResponse<{ downloadUrl: string; fileName: string }>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fromFormat', fromFormat)
    formData.append('toFormat', toFormat)

    try {
      const response = await fetch(`${API_BASE_URL}/documents/convert`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Document conversion failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Conversion failed'
      }
    }
  },

  // Get conversion status
  async getConversionStatus(conversionId: string): Promise<ApiResponse<DocumentConversion>> {
    return apiRequest<DocumentConversion>(`/documents/status/${conversionId}`)
  },

  // Get conversion history
  async getConversionHistory(): Promise<ApiResponse<DocumentConversion[]>> {
    return apiRequest<DocumentConversion[]>('/documents/history')
  }
}

// Real estate ad generation API
export const realEstateApi = {
  // Generate Romanian real estate ad
  async generateAd(request: AdGenerationRequest): Promise<ApiResponse<AdGenerationResponse>> {
    return apiRequest<AdGenerationResponse>('/real-estate/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  // Get generation history
  async getGenerationHistory(): Promise<ApiResponse<AdGenerationResponse[]>> {
    return apiRequest<AdGenerationResponse[]>('/real-estate/history')
  },

  // Save generated ad
  async saveAd(ad: AdGenerationResponse): Promise<ApiResponse<{ id: string }>> {
    return apiRequest<{ id: string }>('/real-estate/save', {
      method: 'POST',
      body: JSON.stringify(ad),
    })
  }
}

// Printer driver API
export const printerApi = {
  // Get available drivers for OS
  async getDrivers(os: 'windows' | 'mac' | 'linux'): Promise<ApiResponse<any[]>> {
    return apiRequest<any[]>(`/printers/drivers/${os}`)
  },

  // Log driver download
  async logDownload(driverId: string, os: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>('/printers/log-download', {
      method: 'POST',
      body: JSON.stringify({ driverId, os }),
    })
  }
}

// Utility functions for API integration
export const apiUtils = {
  // Handle API errors consistently
  handleError: (error: any, defaultMessage: string = 'An error occurred') => {
    console.error('API Error:', error)
    return error?.message || defaultMessage
  },

  // Create form data for file uploads
  createFormData: (data: Record<string, any>) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value)
      } else {
        formData.append(key, String(value))
      }
    })
    return formData
  },

  // Validate API response
  validateResponse: <T>(response: ApiResponse<T>): T | null => {
    if (response.success && response.data) {
      return response.data
    }
    return null
  }
}

// Mock API functions for development/testing
export const mockApi = {
  // Mock document conversion
  async convertDocument(
    file: File,
    fromFormat: 'docx' | 'pdf',
    toFormat: 'docx' | 'pdf'
  ): Promise<ApiResponse<{ downloadUrl: string; fileName: string }>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      success: true,
      data: {
        downloadUrl: URL.createObjectURL(file),
        fileName: file.name.replace(/\.[^/.]+$/, `.${toFormat}`)
      }
    }
  },

  // Mock real estate ad generation
  async generateAd(request: AdGenerationRequest): Promise<ApiResponse<AdGenerationResponse>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const propertyTypes = {
      apartment: "apartament",
      house: "casă",
      commercial: "spațiu comercial",
      land: "teren"
    }

    const toneTexts = {
      professional: "Oportunitate imobiliară excepțională",
      persuasive: "Nu rata această șansă unică!",
      friendly: "Căutăți casa visurilor voastre?"
    }

    let adText = `${toneTexts[request.tone]} în ${request.property.location}!\n\n`
    adText += `Vând ${propertyTypes[request.property.propertyType]} cu următoarele caracteristici:\n`
    adText += `${request.property.details}\n\n`
    adText += `Preț: ${request.property.price} EUR.\n\n`
    adText += `Contactați-mă pentru mai multe detalii și programare vizionare. Oportunitate de investiție excelentă!`
    
    const mockAd: AdGenerationResponse = {
      id: Date.now().toString(),
      adText,
      wordCount: adText.split(' ').length,
      generatedAt: new Date()
    }
    
    return {
      success: true,
      data: mockAd
    }
  }
}
