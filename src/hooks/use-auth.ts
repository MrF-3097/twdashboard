'use client'

import { useState, useEffect } from 'react'

interface AgentData {
  id: number
  name: string
  email: string
  phone?: string
  photo?: string
  position?: string
  created_at?: string
  updatedAt?: string
  // Additional computed fields
  currentMonthCommission?: number
  previousMonthCommission?: number
  monthlyTarget?: number
  ytdCommission?: number
  annualTarget?: number
  totalTransactions?: number
  propertiesCount?: number
}

interface AuthState {
  isLoggedIn: boolean
  agentData: AgentData | null
  isLoading: boolean
}

const STORAGE_KEY = 'towerimob_auth_data'
const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
const STATUS_POLL_INTERVAL = 30 * 1000 // 30 seconds

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    agentData: null,
    isLoading: true
  })

  // Load cached authentication data on mount
  useEffect(() => {
    const loadCachedAuth = () => {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return
      }
      try {
        const cachedData = localStorage.getItem(STORAGE_KEY)
        if (cachedData) {
          const { agentData, timestamp } = JSON.parse(cachedData)
          
          // Check if session is still valid (not expired)
          const now = Date.now()
          if (now - timestamp < SESSION_TIMEOUT) {
            setAuthState({
              isLoggedIn: true,
              agentData,
              isLoading: false
            })
            return
          } else {
            // Session expired, clear cache
            localStorage.removeItem(STORAGE_KEY)
          }
        }
      } catch (error) {
        console.error('Error loading cached auth data:', error)
        localStorage.removeItem(STORAGE_KEY)
      }
      
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }

    loadCachedAuth()
  }, [])

  const login = (agentData: AgentData) => {
    const authData = {
      agentData,
      timestamp: Date.now()
    }
    
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authData))
      }
      setAuthState({
        isLoggedIn: true,
        agentData,
        isLoading: false
      })
    } catch (error) {
      console.error('Error saving auth data to localStorage:', error)
      // Still set the state even if localStorage fails
      setAuthState({
        isLoggedIn: true,
        agentData,
        isLoading: false
      })
    }
  }

  const logout = () => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (error) {
      console.error('Error clearing auth data from localStorage:', error)
    }
    
    setAuthState({
      isLoggedIn: false,
      agentData: null,
      isLoading: false
    })
  }

  const refreshSession = () => {
    if (authState.isLoggedIn && authState.agentData) {
      const authData = {
        agentData: authState.agentData,
        timestamp: Date.now()
      }
      
      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(authData))
        }
      } catch (error) {
        console.error('Error refreshing session:', error)
      }
    }
  }

  // Poll server to ensure agent remains active and session not invalidated
  useEffect(() => {
    if (!authState.isLoggedIn || !authState.agentData?.id) {
      return
    }

    const controller = new AbortController()

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/auth/status?agentId=${authState.agentData?.id}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const result = await response.json()

        if (!response.ok || !result.success) {
          return
        }

        const latestUpdatedAt: string | undefined = result.data?.updatedAt
        const isActive: boolean = result.data?.isActive

        if (!isActive) {
          logout()
          return
        }

        if (latestUpdatedAt && authState.agentData?.updatedAt && latestUpdatedAt !== authState.agentData.updatedAt) {
          logout()
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        console.error('Error verifying session status:', error)
      }
    }

    checkStatus()
    const intervalId = setInterval(checkStatus, STATUS_POLL_INTERVAL)

    return () => {
      controller.abort()
      clearInterval(intervalId)
    }
  }, [authState.agentData, authState.isLoggedIn, logout])

  return {
    ...authState,
    login,
    logout,
    refreshSession
  }
}

