/**
 * News Feed Types
 * Types for news items and related data structures
 */

export interface NewsItemFromDb {
  id: number
  itemType: 'transaction' | 'welcome'
  agentId?: number | null
  agentName: string
  agentAvatar?: string | null
  transactionValue?: number | null
  commission?: number | null
  transactionType?: 'Vanzare' | 'Chirie' | null
  propertyType?: string | null
  location?: string | null
  welcomeMessage?: string | null
  timestamp: string
  createdAt?: string
}




















