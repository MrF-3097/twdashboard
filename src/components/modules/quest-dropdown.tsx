'use client'

import { useState } from 'react'
import { ChevronDown, Target } from 'lucide-react'
import { QuestSystem } from './quest-system'

export const QuestDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="w-full max-w-md mx-auto px-3 py-4">
      {/* Dropdown Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-transparent border border-white/20 rounded-2xl transition-all duration-300 hover:border-white/30 hover:-translate-y-0.5"
        style={{ borderWidth: '0.5px' }}
        aria-expanded={isOpen}
        aria-label="Toggle quest system"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-white">Quest-uri</h3>
            <p className="text-xs text-white/70">Obiective și progres</p>
          </div>
        </div>
        <ChevronDown 
          className={`h-5 w-5 text-white/70 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Content */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="-mx-3 -my-4">
          <QuestSystem />
        </div>
      </div>
    </div>
  )
}

