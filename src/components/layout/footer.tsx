'use client'

import { Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-6 md:py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Creat cu{' '}
              <Heart className="inline h-4 w-4 fill-red-500 text-red-500" />{' '}
              pentru agenți și afaceri profesionale.
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>© 2024 Tower Imob</span>
            <span>•</span>
            <span>Toate drepturile rezervate</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
