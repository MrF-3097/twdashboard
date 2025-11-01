'use client'

import { Home, Building2 } from 'lucide-react'

interface TransactionStatsProps {
  totalTransactions?: number
  propertiesCount?: number
}

export const TransactionStats = ({ 
  totalTransactions = 37, 
  propertiesCount = 0 
}: TransactionStatsProps) => {
  return (
    <div className="mx-4 mb-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Tranzacții Card */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-800 border border-slate-700 p-4 shadow-lg">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,85,105,0.2),transparent_50%)]" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Home size={18} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h4 className="text-[24px] font-bold text-white mb-1">{totalTransactions}</h4>
            <p className="text-[11px] text-[#CBD5E1] mb-0.5">Tranzacții totale</p>
            <p className="text-[10px] text-[#94A3B8]">de la intrarea în agenție</p>
          </div>
        </div>

        {/* Proprietăți Card */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-800 border border-slate-700 p-4 shadow-lg">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,85,105,0.2),transparent_50%)]" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Building2 size={18} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h4 className="text-[24px] font-bold text-white mb-1">{propertiesCount}</h4>
            <p className="text-[11px] text-[#CBD5E1] mb-0.5">Proprietăți în portofoliu</p>
            <p className="text-[10px] text-[#94A3B8]">active în sistem</p>
          </div>
        </div>
      </div>
    </div>
  )
}

