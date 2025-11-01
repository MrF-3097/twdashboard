'use client'

import { UserPlus, FileText, FileBarChart, Scale } from 'lucide-react'

interface QuickActionsProps {
  onActionClick?: (actionId: string) => void
}

export const QuickActions = ({ onActionClick }: QuickActionsProps) => {
  const actions = [
    {
      id: 'add-client',
      icon: UserPlus,
      label: 'Adaugă client nou',
      gradient: 'from-[#06B6D4] to-[#22D3EE]',
    },
    {
      id: 'upload-contract',
      icon: FileText,
      label: 'Încarcă contract',
      gradient: 'from-[#10B981] to-[#34D399]',
    },
    {
      id: 'generate-report',
      icon: FileBarChart,
      label: 'Generează raport evaluare',
      gradient: 'from-[#F59E0B] to-[#FCD34D]',
    },
    {
      id: 'legal-support',
      icon: Scale,
      label: 'Solicită suport juridic',
      gradient: 'from-[#EF4444] to-[#F87171]',
    },
  ]

  const handleActionClick = (actionId: string) => {
    if (onActionClick) {
      onActionClick(actionId)
    }
  }

  return (
    <div className="mb-4">
      <div className="px-5 mb-3">
        <h3 className="text-[15px] font-semibold text-white">Acțiuni rapide</h3>
      </div>
      
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-5 pb-2">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.id)}
                className="flex-shrink-0 group"
              >
                <div className="w-[140px] bg-slate-800 backdrop-blur-sm rounded-[16px] border border-slate-700 p-4 shadow-sm hover:shadow-md transition-all">
                  <div className={`w-12 h-12 rounded-[12px] bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon size={22} className="text-white" strokeWidth={2.5} />
                  </div>
                  <p className="text-[12px] font-semibold text-white leading-tight">
                    {action.label}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

