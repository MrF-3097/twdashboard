'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, AlertCircle } from 'lucide-react'

interface LoginModalProps {
  onLogin: (agentData: any) => void
}

export const LoginModal = ({ onLogin }: LoginModalProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Eroare la autentificare')
        setIsLoading(false)
        return
      }

      if (data.success && data.agent) {
        onLogin(data.agent)
      }
    } catch (err) {
      setError('Eroare de conexiune. Vă rugăm încercați din nou.')
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center mb-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Tower Imob Dashboard
          </CardTitle>
          <CardDescription>
            Autentificați-vă pentru a accesa instrumentele profesionale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="agent@towerimob.ro"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                autoComplete="email"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parolă</Label>
              <Input
                id="password"
                type="password"
                placeholder="Towerimob2025"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                autoComplete="current-password"
                required
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" disabled={isLoading} />
                <span className="text-muted-foreground">Ține-mă minte</span>
              </label>
              <a href="#" className="text-primary hover:underline">
                Ai uitat parola?
              </a>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  <span>Se autentifică...</span>
                </div>
              ) : (
                'Autentificare'
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nu ai cont?{' '}
              <a href="#" className="text-primary hover:underline font-medium">
                Contactează administratorul
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

