'use client'

import { FileText, Building2, Printer, Image, TrendingUp, Wand2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface MobileModuleGridProps {
  onModuleSelect: (module: string) => void
}

export const MobileModuleGrid = ({ onModuleSelect }: MobileModuleGridProps) => {
  const modules = [
    {
      id: 'documents',
      icon: FileText,
      emoji: '📄',
      color: 'from-blue-400 to-blue-600',
      bgLight: 'bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569]',
    },
    {
      id: 'real-estate',
      icon: Building2,
      emoji: '🏠',
      color: 'from-purple-400 to-purple-600',
      bgLight: 'bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569]',
    },
    {
      id: 'printer',
      icon: Printer,
      emoji: '🖨️',
      color: 'from-pink-400 to-pink-600',
      bgLight: 'bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569]',
    },
    {
      id: 'image-editor',
      icon: Image,
      emoji: '🎨',
      color: 'from-orange-400 to-orange-600',
      bgLight: 'bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569]',
    },
    {
      id: 'agent-ranking',
      icon: TrendingUp,
      emoji: '📊',
      color: 'from-green-400 to-green-600',
      bgLight: 'bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569]',
    },
    {
      id: 'photo-fixer',
      icon: Wand2,
      emoji: '✨',
      color: 'from-yellow-400 to-yellow-600',
      bgLight: 'bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569]',
    },
  ]

  return (
    <div className="md:hidden px-4 py-4">
      <h2 className="text-2xl font-black text-white mb-4">Instrumente</h2>
      <div className="grid grid-cols-2 gap-3">
        {modules.map((module) => {
          const Icon = module.icon
          
          return (
            <div
              key={module.id}
              onClick={() => onModuleSelect(module.id)}
              className={`
                relative overflow-hidden border border-slate-700 cursor-pointer
                transform transition-all duration-300 hover:scale-105 active:scale-95
                shadow-lg hover:shadow-xl rounded-2xl bg-slate-800
              `}
            >
              <div className="p-6 flex flex-col items-center justify-center gap-3 min-h-[140px] relative">
                {/* Subtle gradient background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,85,105,0.2),transparent_50%)]" />
                
                {/* Large Emoji Icon */}
                <div className="text-5xl animate-bounce-subtle relative z-10">{module.emoji}</div>
                
                {/* Color Badge with Icon */}
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-2xl
                  bg-gradient-to-br ${module.color} shadow-md relative z-10
                `}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              
              {/* Bottom Color Bar */}
              <div className={`h-1.5 bg-gradient-to-r ${module.color}`} />
            </div>
          )
        })}
      </div>

      <style jsx>{`
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}


