'use client'

import { Building2, FileText, Printer, User, Flame } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PwaInstallButton } from '@/components/ui/pwa-install-button'

interface HeaderProps {
  onProfileClick?: () => void
  streak?: number
}

export function Header({ onProfileClick, streak = 7 }: HeaderProps) {
  return (
    <>
      <PwaInstallButton />
      <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 md:bg-background/95 md:backdrop-blur md:supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 md:h-16 items-center justify-between px-3 md:px-4">
          {/* Mobile - Minimal Logo */}
          <div className="flex items-center space-x-2 md:space-x-3 md:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
              <img 
                src="/Path 1.png" 
                alt="Tower Imob Logo" 
                className="h-6 w-6 object-contain brightness-0 invert"
              />
            </div>
          </div>

          {/* Mobile - Streak Indicator */}
          <div className="flex items-center gap-1 md:hidden">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full shadow-lg">
              <Flame className="h-4 w-4 text-white" />
              <span className="text-sm font-black text-white">{streak}</span>
            </div>
          </div>

          {/* Desktop - Full Logo and Brand */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-lg border border-gray-200">
              <img 
                src="/Path 1.png" 
                alt="Tower Imob Logo" 
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-primary">
                Tower Imob
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Instrumente Profesionale</p>
            </div>
          </div>

          {/* Desktop - Quick Actions */}
          <div className="hidden md:flex items-center space-x-2">
            <Card className="flex items-center space-x-2 px-3 py-1 bg-secondary/50 border-secondary/20">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium">Instrumente Documente</span>
            </Card>
            <Card className="flex items-center space-x-2 px-3 py-1 bg-secondary/50 border-secondary/20">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium">Imobiliare</span>
            </Card>
            <Card className="flex items-center space-x-2 px-3 py-1 bg-secondary/50 border-secondary/20">
              <Printer className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium">Driver Imprimantă</span>
            </Card>
            
            {/* Profile Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={onProfileClick}
              className="relative rounded-full h-10 w-10 border-2 border-primary/20 hover:border-primary hover:bg-primary/10 transition-all duration-300 hover:scale-110"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 opacity-20" />
              <User className="h-5 w-5 relative z-10" />
            </Button>
          </div>
        </div>
      </header>
    </>
  )
}
