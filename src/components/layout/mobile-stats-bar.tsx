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
      <div className="p-4 md:p-6 bg-transparent rounded-2xl">
        <div className="flex gap-3 justify-center">
        {/* Tranzacții - Slate glassmorphic card */}
        <div className="relative overflow-hidden rounded-2xl bg-transparent p-6 border border-transparent transition-all duration-300 hover:-translate-y-1 hover:border-white/30" style={{ borderWidth: '0.5px' }}>
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-center w-[60px] h-[60px] rounded-xl shadow-md animate-gradient-blue">
              <CheckCircle2 className="h-[30px] w-[30px] text-white" />
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-white leading-tight">{transactions}</p>
              <p className="text-sm text-slate-400 font-medium mt-0.5">Vânzări</p>
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
          className="relative overflow-hidden rounded-2xl bg-transparent p-6 border border-transparent cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:border-white/30 active:scale-95 touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent', borderWidth: '0.5px' }}
        >
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-center w-[60px] h-[60px] rounded-xl shadow-md animate-gradient-blue">
              <Building2 className="h-[30px] w-[30px] text-white" />
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-white leading-tight">{propertiesCount}</p>
              <p className="text-sm text-slate-400 font-medium mt-0.5">Proprietăți</p>
            </div>
          </div>
        </div>

        {/* Valoare Proprietati Vandute - Slate/Blue gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-transparent p-6 border border-transparent transition-all duration-300 hover:-translate-y-1 hover:border-white/30" style={{ borderWidth: '0.5px' }}>
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-center w-[60px] h-[60px] rounded-xl shadow-md animate-gradient-blue">
              <Euro className="h-[30px] w-[30px] text-white" />
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-white leading-tight">{formatCurrency(totalValueSold)}</p>
              <p className="text-sm text-slate-400 font-medium mt-0.5">Valoare</p>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

