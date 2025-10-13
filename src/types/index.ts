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
