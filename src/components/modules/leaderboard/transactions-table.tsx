'use client'

import { useMemo, useState } from 'react'
import { useTransactions } from '@/hooks/use-commissions'
import type { Transaction } from '@/types/commissions'
import { RefreshCcw } from 'lucide-react'

export const TransactionsTable = () => {
  const [agent, setAgent] = useState<string>('')
  const [since, setSince] = useState<string>('')

  const { data, error, isLoading, refresh } = useTransactions({ since: since || undefined, agent: agent || undefined })
  const rows = data?.rows || []

  const agents = useMemo(() => {
    const set = new Set(rows.map((r) => r.Agent))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [rows])

  return (
    <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#475569] shadow-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(71,85,105,0.2),transparent_50%)]" />
      <div className="relative z-10 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
          <h3 className="text-xl font-bold text-white">Tranzacții</h3>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col">
              <label className="text-white/70 text-xs mb-1">Agent</label>
              <select value={agent} onChange={(e) => setAgent(e.target.value)} className="bg-white/10 text-white px-2 py-1 rounded-md text-sm">
                <option value="">Toți</option>
                {agents.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-white/70 text-xs mb-1">De la (ISO)</label>
              <input
                type="datetime-local"
                className="bg-white/10 text-white px-2 py-1 rounded-md text-sm"
                onChange={(e) => setSince(e.target.value ? new Date(e.target.value).toISOString() : '')}
              />
            </div>
            <button onClick={() => refresh()} className="flex items-center gap-2 text-white/80 text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md">
              <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Reîmprospătează
            </button>
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-sm mb-3">A apărut o eroare la încărcarea tranzacțiilor.</div>
        )}

        {isLoading && rows.length === 0 ? (
          <div className="text-center py-10 text-white/70">Se încarcă...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-10 text-white/70">Nu există tranzacții</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-white/70">
                <tr>
                  <th className="py-2 pr-3 font-medium">Timestamp</th>
                  <th className="py-2 pr-3 font-medium">Agent</th>
                  <th className="py-2 pr-3 font-medium">Valoare</th>
                  <th className="py-2 pr-3 font-medium">Tip</th>
                  <th className="py-2 pr-3 font-medium">Comision</th>
                </tr>
              </thead>
              <tbody className="text-white/90">
                {rows.map((t, idx) => (
                  <tr key={idx} className="border-t border-white/10">
                    <td className="py-2 pr-3 whitespace-nowrap">{new Date(t.Timestamp).toLocaleString('ro-RO')}</td>
                    <td className="py-2 pr-3">{t.Agent}</td>
                    <td className="py-2 pr-3">€{Math.round(typeof t['Valoare Tranzactie'] === 'number' ? t['Valoare Tranzactie'] : 0).toLocaleString('ro-RO')}</td>
                    <td className="py-2 pr-3">{t['Tip Tranzactie']}</td>
                    <td className="py-2 pr-3 font-semibold">€{(t.Comision || (typeof t['Valoare Tranzactie'] === 'number' ? (t['Valoare Tranzactie'] * (typeof t['Comision %'] === 'number' ? (t['Comision %'] > 1 ? t['Comision %'] / 100 : t['Comision %']) : 0)) : 0)).toFixed(0)}</td>
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






