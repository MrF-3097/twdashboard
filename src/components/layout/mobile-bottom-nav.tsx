'use client'

import { useState } from 'react'
import { Home, CreditCard, Send, Grid, User, Wrench, TrendingUp, FileText, Building2, Printer, Image, Settings } from 'lucide-react'

interface MobileBottomNavProps {
  activeTab: 'home' | 'tools' | 'leaderboard' | 'profile' | 'admin'
  onTabChange: (tab: 'home' | 'tools' | 'leaderboard' | 'profile' | 'admin') => void
  activeModule?: string
  onModuleSelect?: (module: string) => void
}

export const MobileBottomNav = ({ 
  activeTab, 
  onTabChange, 
  activeModule = 'documents',
  onModuleSelect 
}: MobileBottomNavProps) => {
  const [showToolsDropdown, setShowToolsDropdown] = useState(false)

  // Revolut-style 5-tab navigation
  const revolutTabs = [
    { id: 'home' as const, icon: Home, label: 'Acasă' },
    { id: 'tools' as const, icon: Grid, label: 'Hub' },
    { id: 'leaderboard' as const, icon: TrendingUp, label: 'Stats' },
    { id: 'admin' as const, icon: Settings, label: 'Admin' },
    { id: 'profile' as const, icon: User, label: 'Profil' },
  ] as const

  const tools = [
    { id: 'documents', icon: FileText, label: 'Documente' },
    { id: 'real-estate', icon: Building2, label: 'Imobiliare' },
    { id: 'printer', icon: Printer, label: 'Driver' },
    { id: 'image-editor', icon: Image, label: 'Imagini' },
  ]

  const handleTabClick = (tabId: string) => {
    if (tabId === 'tools') {
      setShowToolsDropdown(!showToolsDropdown)
    } else {
      setShowToolsDropdown(false)
      onTabChange(tabId as any)
    }
  }

  const handleToolSelect = (toolId: string) => {
    if (onModuleSelect) {
      onModuleSelect(toolId)
    }
    setShowToolsDropdown(false)
    onTabChange('tools')
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-50 safe-area-bottom">
      {/* Glassmorphism blur overlay for depth */}
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" />
      
      {/* Tools Dropdown - Dark sheet style */}
      {showToolsDropdown && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 rounded-t-[24px] border border-slate-700 shadow-[0_-4px_24px_rgba(0,0,0,0.5)] z-50 animate-in slide-in-from-bottom-2 duration-300">
          {/* Sheet handle indicator */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-slate-600 rounded-full" />
          </div>
          
          <div className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-3">
              {tools.map((tool) => {
                const Icon = tool.icon
                const isActive = tool.id === activeModule
                
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-gradient-to-br from-slate-700 to-blue-700 text-white' 
                        : 'hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <Icon 
                      size={24} 
                      className={isActive ? 'text-white' : 'text-slate-400'} 
                    />
                    <span className={`text-[11px] font-semibold text-center ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {tool.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Revolut-style tab bar */}
      <div className="relative z-10 flex items-center justify-around max-w-[420px] mx-auto h-20 safe-area-spacing">
        {revolutTabs.map((tab, index) => {
          const isActive = activeTab === tab.id && !showToolsDropdown
          const Icon = tab.icon
          
          return (
            <button
              key={`${tab.id}-${index}`}
              onClick={() => handleTabClick(tab.id)}
              className="flex flex-col items-center gap-1 min-w-[64px] transition-all active:scale-95"
            >
              <div className={`relative transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  fill={isActive ? 'currentColor' : 'none'}
                />
              </div>
              <span
                className={`text-[11px] font-medium transition-colors ${
                  isActive ? 'text-blue-400' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-blue-400 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}


