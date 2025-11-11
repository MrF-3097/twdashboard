'use client'

import { useState, useEffect, useRef } from 'react'
import { Home, TrendingUp, User, FileText, Building2, Printer, Image, FolderOpen, Plus, X, Bell } from 'lucide-react'

interface MobileBottomNavProps {
  activeTab: 'home' | 'tools' | 'leaderboard' | 'profile' | 'news'
  onTabChange: (tab: 'home' | 'tools' | 'leaderboard' | 'profile' | 'news') => void
  activeModule?: string
  onModuleSelect?: (module: string) => void
  variant?: 'default' | 'portfolio' | 'profile' | 'stats' | 'imobiliare' | 'documents' | 'news'
}

export const MobileBottomNav = ({ 
  activeTab, 
  onTabChange, 
  activeModule = 'documents',
  onModuleSelect,
  variant = 'default'
}: MobileBottomNavProps) => {
  const [showToolsDropdown, setShowToolsDropdown] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nav-tools-dropdown')
      return saved === 'true'
    }
    return false
  })
  const [circlePosition, setCirclePosition] = useState(0)
  const navItemsRef = useRef<(HTMLButtonElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const navContainerRef = useRef<HTMLDivElement>(null)
  const previousActiveTab = useRef<string | null>(null)

  // Nav items (Hub removed - now floating bubble button)
  const navItems = [
    { id: 'home' as const, icon: Home, label: 'Acasă' },
    { id: 'news' as const, icon: Bell, label: 'News' },
    { id: 'leaderboard' as const, icon: TrendingUp, label: 'Stats' },
    { id: 'profile' as const, icon: User, label: 'Profil' },
  ] as const

  const tools = [
    { id: 'documents', icon: FileText, label: 'Documente' },
    { id: 'real-estate', icon: Building2, label: 'Imobiliare' },
    { id: 'printer', icon: Printer, label: 'Driver' },
    { id: 'image-editor', icon: Image, label: 'Imagini' },
    { id: 'portfolio', icon: FolderOpen, label: 'Portofoliu' },
  ]

  // Calculate circle position based on active tab
  const updateCirclePosition = (tabId: string) => {
    const index = navItems.findIndex(item => item.id === tabId)
    if (index === -1) return

    const button = navItemsRef.current[index]
    if (!button || !navContainerRef.current) return

    const navContainerRect = navContainerRef.current.getBoundingClientRect()
    const buttonRect = button.getBoundingClientRect()
    
    // Calculate center of button relative to nav container
    // The circle uses translate(-50%, ...) so we need the absolute center position
    const buttonCenter = buttonRect.left - navContainerRect.left + buttonRect.width / 2
    setCirclePosition(buttonCenter)
  }

  // Update circle position when activeTab changes
  useEffect(() => {
    // Only update position if tab actually changed
    if (previousActiveTab.current !== activeTab) {
      updateCirclePosition(activeTab)
      previousActiveTab.current = activeTab
    }
  }, [activeTab])

  // Initial position on mount
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (previousActiveTab.current === null) {
        updateCirclePosition(activeTab)
        previousActiveTab.current = activeTab
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Recalculate on resize
  useEffect(() => {
    const handleResize = () => {
      updateCirclePosition(activeTab)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeTab])

  const handleTabClick = (tabId: string) => {
    setShowToolsDropdown(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('nav-tools-dropdown', 'false')
    }
    onTabChange(tabId as any)
  }

  const handleHubBubbleClick = () => {
    const newState = !showToolsDropdown
    setShowToolsDropdown(newState)
    if (typeof window !== 'undefined') {
      localStorage.setItem('nav-tools-dropdown', newState.toString())
    }
  }

  const handleToolSelect = (toolId: string) => {
    if (onModuleSelect) {
      onModuleSelect(toolId)
    }
    setShowToolsDropdown(false)
    onTabChange('tools')
  }

  // Get FAB gradient and shadow based on variant (matching hero section gradients)
  const getFABGradient = () => {
    switch (variant) {
      case 'portfolio':
        // Moody blue (#8870D0) gradient
        return {
          gradient: 'from-[#8870D0] to-[#6B5A9F] hover:from-[#6B5A9F] hover:to-[#8870D0]',
          shadow: 'rgba(136, 112, 208, 0.5)',
          toolGradient: 'from-[#8870D0] to-[#6B5A9F]'
        }
      case 'profile':
        // Golden/orange gradient
        return {
          gradient: 'from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800',
          shadow: 'rgba(251, 146, 60, 0.5)',
          toolGradient: 'from-orange-600 to-amber-700'
        }
      case 'stats':
        // Light yellow and bright gradient
        return {
          gradient: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
          shadow: 'rgba(234, 179, 8, 0.5)',
          toolGradient: 'from-yellow-500 to-yellow-600'
        }
      case 'imobiliare':
        // Teal and bright green gradient
        return {
          gradient: 'from-[#3D6260] to-[#10B981] hover:from-[#10B981] hover:to-[#34D399]',
          shadow: 'rgba(16, 185, 129, 0.5)',
          toolGradient: 'from-[#3D6260] to-[#10B981]'
        }
      case 'documents':
        // Dark red/maroon gradient starting from #74070e
        return {
          gradient: 'from-[#74070e] to-[#A0151E] hover:from-[#A0151E] hover:to-[#C92A2F]',
          shadow: 'rgba(116, 7, 14, 0.5)',
          toolGradient: 'from-[#74070e] to-[#A0151E]'
        }
      case 'news':
        // Baby blue gradient
        return {
          gradient: 'from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600',
          shadow: 'rgba(56, 189, 248, 0.5)',
          toolGradient: 'from-sky-400 to-blue-500'
        }
      default:
        // Default blue gradient
        return {
          gradient: 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
          shadow: 'rgba(37, 99, 235, 0.5)',
          toolGradient: 'from-blue-600 to-purple-600'
        }
    }
  }

  const fabGradient = getFABGradient()

  return (
    <>
      {/* Floating Hub Bubble Button */}
      <div className="md:hidden fixed bottom-24 right-4 z-[1001]">
        {/* Tools Menu - Always rendered, tied to FAB */}
        <div 
          className="absolute bottom-full right-0 mb-3 z-50"
          style={{
            opacity: showToolsDropdown ? 1 : 0,
            pointerEvents: showToolsDropdown ? 'auto' : 'none'
          }}
        >
          <div className="flex flex-col gap-4 items-end">
            {tools.map((tool, index) => {
              const Icon = tool.icon
              const isActive = tool.id === activeModule
              
              // First item (Documente) appears first
              // Calculate travel distance from FAB position - first item travels least
              const itemHeight = 56
              const gap = 16
              const travelDistance = index * (itemHeight + gap)
              
              // Calculate delay for CSS animation - first item has no delay
              const delay = showToolsDropdown ? index * 0.06 : 0
              
              return (
                <button
                  key={tool.id}
                  onClick={() => handleToolSelect(tool.id)}
                  className="flex flex-row items-center gap-4 transition-all active:scale-95"
                  style={{
                    opacity: showToolsDropdown ? 1 : 0,
                    transform: showToolsDropdown 
                      ? 'translateY(0) scale(1)' 
                      : `translateY(${travelDistance + 12}px) scale(0.7)`,
                    transition: `opacity 0.25s ease-out ${delay}s, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
                    willChange: 'transform, opacity'
                  }}
                >
                  {/* Text label on the left */}
                  <span className={`text-base font-semibold transition-colors ${
                    isActive ? 'text-white' : 'text-slate-300'
                  }`}>
                    {tool.label}
                  </span>
                  
                  {/* Circular icon button on the right */}
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all bg-gradient-to-br ${fabGradient.toolGradient} ${
                    isActive ? 'shadow-lg scale-110' : 'shadow-md opacity-80 hover:opacity-100'
                  }`}>
                    <Icon 
                      size={24} 
                      className="text-white" 
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Hub Bubble Button */}
        <button
          onClick={handleHubBubbleClick}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
            showToolsDropdown 
              ? 'bg-transparent scale-110' 
              : `bg-gradient-to-br ${fabGradient.gradient} shadow-2xl hover:scale-110 active:scale-95`
          }`}
          style={{
            boxShadow: showToolsDropdown 
              ? 'none'
              : `0 20px 25px -5px ${fabGradient.shadow}, 0 10px 10px -5px ${fabGradient.shadow}`
          }}
          aria-label="Hub"
        >
          {showToolsDropdown ? (
            <X 
              size={28} 
              className="text-white transition-all duration-300"
              strokeWidth={2.5}
            />
          ) : (
            <Plus 
              size={28} 
              className="text-white transition-all duration-300"
              strokeWidth={2.5}
            />
          )}
        </button>
      </div>

      {/* Backdrop when tools menu is open - Always rendered */}
      <div 
        className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[1000] transition-opacity duration-200"
        style={{
          opacity: showToolsDropdown ? 1 : 0,
          pointerEvents: showToolsDropdown ? 'auto' : 'none'
        }}
        onClick={() => {
          setShowToolsDropdown(false)
          if (typeof window !== 'undefined') {
            localStorage.setItem('nav-tools-dropdown', 'false')
          }
        }}
      />

      {/* Floating Circle Navigation Bar */}
      <div 
        ref={containerRef}
        className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] flex items-center justify-center z-[1000] safe-area-bottom"
      >
        {/* Nav Items Container */}
        <div ref={navContainerRef} className="relative flex gap-6 items-center h-full">
          {/* Floating Circle Indicator */}
          <div
            className="absolute w-14 h-14 rounded-full bg-slate-700/40 border-2 border-slate-600/30 z-[1] transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
            style={{
              left: `${circlePosition}px`,
              top: '50%',
              transform: activeTab
                ? 'translate(-50%, calc(-50% - 20px)) scale(1.15)' 
                : 'translate(-50%, -50%) scale(1)',
            }}
          />

          {navItems.map((tab, index) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  navItemsRef.current[index] = el
                }}
                onClick={() => handleTabClick(tab.id)}
                className="flex flex-col items-center justify-center gap-1 cursor-pointer relative h-full px-4 transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95"
                aria-current={isActive ? 'page' : undefined}
                aria-label={tab.label}
                style={{
                  transform: isActive ? 'translateY(-20px)' : 'translateY(0px)',
                }}
              >
                {/* Icon */}
                <div 
                  className={`w-6 h-6 flex items-center justify-center transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] relative z-[2] ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}
                  style={{
                    color: isActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)',
                  }}
                >
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 2}
                    fill={isActive ? 'currentColor' : 'none'}
                  />
                </div>
                
                {/* Label */}
                <span
                  className={`text-xs font-medium transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] relative z-[2] tracking-wide ${
                    isActive ? 'opacity-100' : 'opacity-50'
                  }`}
                  style={{
                    color: isActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)',
                  }}
                >
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
