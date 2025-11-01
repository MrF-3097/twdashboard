'use client'

import { ArrowLeftRight } from 'lucide-react'

interface MobileDashboardHeaderProps {
  onSwitchProfile: () => void
  agentName?: string
  agentRole?: string
  agentAvatar?: string
}

export const MobileDashboardHeader = ({ 
  onSwitchProfile, 
  agentName = "Alex Munteanu", 
  agentRole = "Broker Associate",
  agentAvatar 
}: MobileDashboardHeaderProps) => {
  const currentDate = new Date().toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 border-2 border-white/20 shadow-md rounded-full overflow-hidden bg-gradient-to-br from-slate-600 to-blue-600 flex items-center justify-center">
            {agentAvatar ? (
              <img 
                src={agentAvatar} 
                alt={agentName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold text-lg">
                {agentName.split(' ').map(n => n[0]).join('')}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-[17px] font-semibold text-white">{agentName}</h1>
            <p className="text-[13px] text-white/70">{agentRole}</p>
          </div>
        </div>
        
        <button
          onClick={onSwitchProfile}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/20 transition-colors"
        >
          <ArrowLeftRight size={14} className="text-white/80" />
          <span className="text-[12px] font-semibold text-white/80">Schimbă</span>
        </button>
      </div>
      
      <p className="text-[11px] text-white/60">
        Ultima actualizare: {currentDate}
      </p>
    </div>
  )
}

