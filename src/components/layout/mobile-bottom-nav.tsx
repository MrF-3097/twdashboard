'use client'

import { Home, TrendingUp, User, Zap } from 'lucide-react'

interface MobileBottomNavProps {
  activeTab: 'home' | 'tools' | 'stats' | 'profile'
  onTabChange: (tab: 'home' | 'tools' | 'stats' | 'profile') => void
}

export const MobileBottomNav = ({ activeTab, onTabChange }: MobileBottomNavProps) => {
  const tabs = [
    { id: 'home' as const, icon: Home, label: 'Acasă', color: 'text-blue-500' },
    { id: 'tools' as const, icon: Zap, label: 'Instrumente', color: 'text-purple-500' },
    { id: 'stats' as const, icon: TrendingUp, label: 'Clasament', color: 'text-green-500' },
    { id: 'profile' as const, icon: User, label: 'Profil', color: 'text-yellow-500' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg safe-area-bottom">
      <div className="grid grid-cols-4 h-20 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                isActive ? 'scale-110' : 'scale-100 opacity-60'
              }`}
              aria-label={tab.label}
            >
              <div className={`relative ${isActive ? 'animate-bounce-subtle' : ''}`}>
                <div
                  className={`
                    flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300
                    ${isActive 
                      ? `bg-gradient-to-br ${tab.id === 'home' ? 'from-blue-400 to-blue-600' : 
                         tab.id === 'tools' ? 'from-purple-400 to-purple-600' :
                         tab.id === 'stats' ? 'from-green-400 to-green-600' :
                         'from-yellow-400 to-yellow-600'} shadow-lg` 
                      : 'bg-gray-100'
                    }
                  `}
                >
                  <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                </div>
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full opacity-60" />
                )}
              </div>
              <span
                className={`text-[10px] font-semibold transition-all duration-300 ${
                  isActive ? tab.color : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
      <style jsx>{`
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 0.6s ease-in-out;
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </nav>
  )
}


