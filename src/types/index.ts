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

// Agent leaderboard types
export interface Agent {
  id: string | number
  name: string
  email?: string
  phone?: string
  avatar?: string
  profile_picture?: string
  total_sales?: number
  closed_transactions?: number
  total_value?: number
  active_listings?: number
  rank?: number
  previous_rank?: number
  xp?: number
  level?: number
  badges?: string[]
  last_transaction_date?: string
  // REBS specific fields
  first_name?: string
  last_name?: string
  position?: string
  is_active?: boolean
  resource_uri?: string
}

export interface AgentStats {
  total_agents: number
  total_transactions: number
  total_sales_value: number
  top_performer: Agent | null
}

// REBS API Response Types
export interface RebsProperty {
  id: number
  display_id?: string
  title?: string
  description?: string
  property_type?: number
  availability?: number | boolean | string
  active?: boolean
  for_sale?: boolean
  for_rent?: boolean
  price_sale?: number
  price_rent?: number
  currency_sale?: number
  currency_rent?: number
  rooms?: number
  bathrooms?: number
  surface_useable?: number
  surface_built?: number
  street?: string
  street_number?: string
  city_obj?: number
  region_obj?: number
  lat?: number
  lng?: number
  date_added?: string
  [key: string]: unknown // Allow additional fields from API
}

export interface RebsRequest {
  id: number
  display_id?: string
  title?: string
  details?: string
  comments_general?: string
  agent?: number | { id: number; name?: string }
  property_type?: number
  transaction_type?: number
  price_filter_gte?: number
  price_filter_lte?: number
  rooms_filter_gte?: number
  rooms_filter_lte?: number
  date_added?: string
  cities?: string[]
  region_obj?: number
  contact_ids?: number[]
  [key: string]: unknown // Allow additional fields from API
}

export interface RebsApiResponse<T> {
  results?: T[]
  objects?: T[]
  count?: number
  total_count?: number
  next?: string | null
  previous?: string | null
  meta?: {
    total_count?: number
    page?: number
    page_size?: number
    has_next?: boolean
    has_previous?: boolean
    next?: string | null
    previous?: string | null
  }
}

export interface PropertiesApiResponse {
  objects: RebsProperty[]
  meta: {
    total_count: number
    limit: number
    offset: number
  }
}

export interface RequestsApiResponse {
  requests: RebsRequest[]
  totalCount: number
}

export interface LeaderboardRankChange {
  agentId: string | number
  oldRank: number
  newRank: number
  type: 'up' | 'down' | 'same'
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
