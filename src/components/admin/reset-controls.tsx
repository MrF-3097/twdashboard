'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLeaderboard } from '@/hooks/use-commissions'

export const ResetControls = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: leaderboardData, refresh } = useLeaderboard()

  const totalTransactions = leaderboardData?.rows.reduce((sum, r) => sum + r.NrTranzactii, 0) || 0

  const handleReset = async () => {
    const confirmed = confirm(
      `Ești sigur că vrei să ștergi TOATE tranzacțiile și să resetezi clasamentul?\n\n${totalTransactions} tranzacții vor fi șterse.\nAceastă acțiune este ireversibilă!`
    )
    
    if (!confirmed) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/reset-commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to reset commissions')
      }

      // Refresh leaderboard
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error resetting commissions:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-900/60 to-red-800/50 border border-red-700/50 p-6 md:p-8 shadow-xl hover:shadow-2xl transition-shadow">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.25),transparent_50%)]" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
            <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-white">Acțiuni Periculoase</h3>
        </div>

        {error && (
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm md:text-base shadow-lg">
            ✗ {error}
          </div>
        )}

        <p className="text-sm md:text-base text-white/80 mb-4 md:mb-6 leading-relaxed">
          Resetare completă a tuturor tranzacțiilor și comisioanelor. Această acțiune este <span className="font-semibold text-red-300">ireversibilă</span>.
        </p>

        <Button
          onClick={handleReset}
          disabled={loading || totalTransactions === 0}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-800 disabled:to-red-900 text-white h-11 md:h-12 text-sm md:text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Trash2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
              Se resetează...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Resetare Completă ({totalTransactions} tranzacții)
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

