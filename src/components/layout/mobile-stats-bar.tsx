'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, Euro, CheckCircle2 } from 'lucide-react'

interface MobileStatsBarProps {
  transactions?: number
  currentMonthCommission?: number
  totalCommission?: number
}

export const MobileStatsBar = ({ 
  transactions = 0, 
  currentMonthCommission = 0, 
  totalCommission = 0 
}: MobileStatsBarProps) => {
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
    <div className="md:hidden mb-4 px-3">
      <div className="flex gap-2 justify-between">
        {/* Tranzacții */}
        <Card className="flex-1 p-3 flex items-center gap-2 bg-gradient-to-br from-blue-400 to-blue-600 border-0 overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-black text-white leading-none">{transactions}</p>
            <p className="text-[10px] text-white/80 font-medium">Vânzări</p>
          </div>
        </Card>

        {/* Comision Luna Curentă */}
        <Card className="flex-1 p-3 flex items-center gap-2 bg-gradient-to-br from-green-400 to-green-600 border-0 overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm">
            <Euro className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xl font-black text-white leading-none">{formatCurrency(currentMonthCommission)}</p>
            <p className="text-[10px] text-white/80 font-medium">Luna</p>
          </div>
        </Card>

        {/* Comision Total */}
        <Card className="flex-1 p-3 flex items-center gap-2 bg-gradient-to-br from-purple-400 to-purple-600 border-0 overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xl font-black text-white leading-none">{formatCurrency(totalCommission)}</p>
            <p className="text-[10px] text-white/80 font-medium">Total</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

