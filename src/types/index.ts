// Document conversion types
export interface ConversionStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress?: number
  message?: string
  downloadUrl?: string
}

export interface DocumentConversion {
  id: string
  fileName: string
  fileSize: number
  fromFormat: 'docx' | 'pdf'
  toFormat: 'docx' | 'pdf'
  status: ConversionStatus
  uploadedAt: Date
}

// Real estate ad generation types
export interface PropertyDetails {
  location: string
  price: string
  propertyType: 'apartment' | 'house' | 'commercial' | 'land'
  details: string
}

export interface AdGenerationRequest {
  property: PropertyDetails
  tone: 'professional' | 'persuasive' | 'friendly'
  aiRules: string
}

export interface AdGenerationResponse {
  id: string
  adText: string
  wordCount: number
  generatedAt: Date
}

// Printer driver types
export interface PrinterDriver {
  os: 'windows' | 'mac' | 'linux'
  name: string
  downloadUrl: string
  version: string
  fileSize: string
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
