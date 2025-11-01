'use client'

import { useMemo, useState } from 'react'
import { useLeaderboard } from '@/hooks/use-commissions'
import type { LeaderboardRow } from '@/types/commissions'
import { RefreshCcw } from 'lucide-react'

interface Props {
  since?: string
  agent?: string
}

export const CommissionLeaderboard = ({ since, agent }: Props) => {
  const { data, error, isLoading, refresh } = useLeaderboard({ since, agent })
  const rows = data?.rows || []

  return (
    <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569] shadow-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,85,105,0.2),transparent_50%)]" />
      <div className="relative z-10 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Leaderboard Comisioane</h3>
          <button onClick={() => refresh()} className="flex items-center gap-2 text-white/80 text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md">
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Reîmprospătează
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-sm mb-3">A apărut o eroare la încărcarea clasamentului.</div>
        )}

        {isLoading && rows.length === 0 ? (
          <div className="text-center py-10 text-white/70">Se încarcă...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-10 text-white/70">Nu există date</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-white/70">
                <tr>
                  <th className="py-2 pr-3 font-medium">Rank</th>
                  <th className="py-2 pr-3 font-medium">Agent</th>
                  <th className="py-2 pr-3 font-medium">NrTranzacții</th>
                  <th className="py-2 pr-3 font-medium">Suma Valoare</th>
                  <th className="py-2 pr-3 font-medium">Suma Comision</th>
                </tr>
              </thead>
              <tbody className="text-white/90">
                {rows.map((r) => (
                  <tr key={r.Agent} className="border-t border-white/10">
                    <td className="py-2 pr-3">{r.Rank}</td>
                    <td className="py-2 pr-3">{r.Agent}</td>
                    <td className="py-2 pr-3">{r.NrTranzactii}</td>
                    <td className="py-2 pr-3">€{Math.round(r.SumaValoare).toLocaleString('ro-RO')}</td>
                    <td className="py-2 pr-3 font-semibold">€{Math.round(r.SumaComision).toLocaleString('ro-RO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}






