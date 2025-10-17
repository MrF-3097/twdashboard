'use client'

import { Building2, FileText, Printer } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { PwaInstallButton } from '@/components/ui/pwa-install-button'

export function Header() {
  return (
    <>
      <PwaInstallButton />
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
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

        {/* Quick Actions */}
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
        </div>
      </div>
      </header>
    </>
  )
}
