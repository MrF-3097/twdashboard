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
      bgLight: 'bg-blue-50',
    },
    {
      id: 'real-estate',
      icon: Building2,
      emoji: '🏠',
      color: 'from-purple-400 to-purple-600',
      bgLight: 'bg-purple-50',
    },
    {
      id: 'printer',
      icon: Printer,
      emoji: '🖨️',
      color: 'from-pink-400 to-pink-600',
      bgLight: 'bg-pink-50',
    },
    {
      id: 'image-editor',
      icon: Image,
      emoji: '🎨',
      color: 'from-orange-400 to-orange-600',
      bgLight: 'bg-orange-50',
    },
    {
      id: 'agent-ranking',
      icon: TrendingUp,
      emoji: '📊',
      color: 'from-green-400 to-green-600',
      bgLight: 'bg-green-50',
    },
    {
      id: 'photo-fixer',
      icon: Wand2,
      emoji: '✨',
      color: 'from-yellow-400 to-yellow-600',
      bgLight: 'bg-yellow-50',
    },
  ]

  return (
    <div className="md:hidden px-3 py-4">
      <div className="grid grid-cols-2 gap-3">
        {modules.map((module) => {
          const Icon = module.icon
          
          return (
            <Card
              key={module.id}
              onClick={() => onModuleSelect(module.id)}
              className={`
                relative overflow-hidden border-0 p-0 cursor-pointer
                transform transition-all duration-300 hover:scale-105 active:scale-95
                shadow-lg hover:shadow-xl
              `}
            >
              <div className={`${module.bgLight} p-6 flex flex-col items-center justify-center gap-3 min-h-[140px]`}>
                {/* Large Emoji Icon */}
                <div className="text-5xl animate-bounce-subtle">{module.emoji}</div>
                
                {/* Color Badge with Icon */}
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-2xl
                  bg-gradient-to-br ${module.color} shadow-md
                `}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              
              {/* Bottom Color Bar */}
              <div className={`h-2 bg-gradient-to-r ${module.color}`} />
            </Card>
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


