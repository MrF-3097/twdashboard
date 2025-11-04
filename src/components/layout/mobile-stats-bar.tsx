'use client'

import React from 'react'
import { TrendingUp, Euro, CheckCircle2, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MobileStatsBarProps {
  transactions?: number
  currentMonthCommission?: number
  totalCommission?: number
  propertiesCount?: number
  totalValueSold?: number
  onPropertiesClick?: () => void
}

export const MobileStatsBar = ({ 
  transactions = 0, 
  currentMonthCommission = 0, 
  totalCommission = 0,
  propertiesCount = 0,
  totalValueSold = 0,
  onPropertiesClick
}: MobileStatsBarProps) => {
  const router = useRouter()

  React.useEffect(() => {
    console.log('🔵 [MobileStatsBar] Component mounted', {
      propertiesCount,
      hasOnPropertiesClick: !!onPropertiesClick,
      routerAvailable: !!router,
    })
  }, [propertiesCount, onPropertiesClick, router])

  const handlePropertiesClick = (e?: React.MouseEvent) => {
    console.log('🔵 [MobileStatsBar] Properties card clicked!', {
      event: e,
      hasOnPropertiesClick: !!onPropertiesClick,
      router: router,
      timestamp: new Date().toISOString(),
    })
    
    if (onPropertiesClick) {
      console.log('🔵 [MobileStatsBar] Using onPropertiesClick callback')
      onPropertiesClick()
    } else {
      console.log('🔵 [MobileStatsBar] Using router.push to /properties')
      try {
        router.push('/properties')
        console.log('🔵 [MobileStatsBar] router.push called successfully')
      } catch (error) {
        console.error('🔴 [MobileStatsBar] Error navigating to /properties:', error)
      }
    }
  }
  const formatCurrency = (amount: number) => {
    if (amount >= 10000) {
      return `${Math.floor(amount / 1000)}k`
    }
    return new Intl.NumberFormat('ro-RO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="md:hidden mb-4 px-4">
      <div className="flex gap-3 justify-between">
        {/* Tranzacții - Slate glassmorphic card */}
        <div className="flex-1 relative overflow-hidden rounded-2xl bg-slate-800 border border-slate-700 p-4 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-600/20 to-blue-600/20 opacity-50" />
          <div className="relative z-10 flex flex-col items-start gap-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-md">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white leading-tight">{transactions}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Vânzări</p>
            </div>
          </div>
        </div>

        {/* Proprietăți - Blue/Purple accent - Clickable */}
        <div 
          onClick={(e) => {
            console.log('🟢 [MobileStatsBar] onClick event fired', {
              target: e.target,
              currentTarget: e.currentTarget,
              bubbles: e.bubbles,
              defaultPrevented: e.defaultPrevented,
            })
            e.preventDefault()
            e.stopPropagation()
            handlePropertiesClick(e)
          }}
          onMouseDown={(e) => {
            console.log('🟢 [MobileStatsBar] onMouseDown event fired')
          }}
          onTouchStart={(e) => {
            console.log('🟢 [MobileStatsBar] onTouchStart event fired', {
              touches: e.touches.length,
            })
          }}
          onKeyDown={(e) => {
            console.log('🟢 [MobileStatsBar] onKeyDown event fired', { key: e.key })
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handlePropertiesClick()
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="View active properties"
          className="flex-1 relative overflow-hidden rounded-2xl bg-slate-800 border border-slate-700 p-4 shadow-lg cursor-pointer transform transition-all duration-200 hover:scale-105 active:scale-95 hover:border-purple-500/50 touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 opacity-50 pointer-events-none" />
          <div className="relative z-10 flex flex-col items-start gap-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-md">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white leading-tight">{propertiesCount}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Proprietăți</p>
            </div>
          </div>
        </div>

        {/* Valoare Proprietati Vandute - Slate/Blue gradient */}
        <div className="flex-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-blue-700 to-slate-700 p-4 shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <div className="relative z-10 flex flex-col items-start gap-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md">
              <Euro className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-white leading-tight">{formatCurrency(totalValueSold)}</p>
              <p className="text-xs text-white/80 font-medium mt-0.5">Valoare</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

