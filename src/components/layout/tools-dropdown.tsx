'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, FileText, Building2, Printer, Image, TrendingUp, Wand2, FolderOpen } from 'lucide-react'

interface ToolsDropdownProps {
  activeModule: string
  onModuleSelect: (module: string) => void
  isOpen: boolean
  onToggle: () => void
}

export const ToolsDropdown = ({ activeModule, onModuleSelect, isOpen, onToggle }: ToolsDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null)

  const tools = [
    { id: 'documents', icon: FileText, label: 'Documente', shortLabel: 'Doc' },
    { id: 'real-estate', icon: Building2, label: 'Imobiliare', shortLabel: 'Imob' },
    { id: 'printer', icon: Printer, label: 'Driver', shortLabel: 'Driver' },
    { id: 'image-editor', icon: Image, label: 'Imagini', shortLabel: 'Img' },
    { id: 'agent-ranking', icon: TrendingUp, label: 'Ranking', shortLabel: 'Rank' },
    { id: 'photo-fixer', icon: Wand2, label: 'Expansiune', shortLabel: 'Exp' },
    { id: 'portfolio', icon: FolderOpen, label: 'Portofoliu', shortLabel: 'Port' },
  ]

  const activeTool = tools.find(tool => tool.id === activeModule)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onToggle()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onToggle])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700 hover:bg-slate-700 transition-colors"
      >
        {activeTool && (
          <>
            <activeTool.icon size={14} className="text-slate-300" />
            <span className="text-[12px] font-semibold text-white">{activeTool.shortLabel}</span>
          </>
        )}
        <ChevronDown 
          size={12} 
          className={`text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 rounded-[12px] border border-slate-700 shadow-lg z-50">
          <div className="p-2">
            {tools.map((tool) => {
              const Icon = tool.icon
              const isActive = tool.id === activeModule
              
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    onModuleSelect(tool.id)
                    onToggle()
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-[8px] transition-colors ${
                    isActive 
                      ? tool.id === 'real-estate'
                        ? 'bg-[#10B981]/20 text-[#10B981]'
                        : 'bg-blue-600/20 text-blue-400'
                      : 'hover:bg-slate-700 text-white'
                  }`}
                >
                  <Icon size={16} className={isActive ? (tool.id === 'real-estate' ? 'text-[#10B981]' : 'text-blue-400') : 'text-slate-300'} />
                  <span className="text-[13px] font-medium">{tool.label}</span>
                  {isActive && (
                    <div className={`ml-auto w-2 h-2 rounded-full ${tool.id === 'real-estate' ? 'bg-[#10B981]' : 'bg-blue-400'}`} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

