'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEurRonRate } from '@/hooks/use-eur-ron-rate'

interface CommissionConverterProps {
  labelRon?: string
  labelEur?: string
  valueRon?: number
  onChangeRon?: (value: number) => void
  disabled?: boolean
  hint?: string
}

export const CommissionConverter = ({
  labelRon = 'Comision (RON)',
  labelEur = 'Comision (EUR)',
  valueRon,
  onChangeRon,
  disabled,
  hint,
}: CommissionConverterProps) => {
  const controlled = typeof valueRon === 'number' && typeof onChangeRon === 'function'
  const [localRon, setLocalRon] = useState<string>(valueRon?.toString() ?? '')
  const { rate, loading, error } = useEurRonRate()

  useEffect(() => {
    if (controlled) {
      setLocalRon(valueRon?.toString() ?? '')
    }
  }, [controlled, valueRon])

  const handleRonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    setLocalRon(newValue)

    if (controlled && onChangeRon) {
      const numeric = parseFloat(newValue)
      onChangeRon(Number.isFinite(numeric) ? numeric : 0)
    }
  }

  const numericRon = parseFloat(localRon)
  const eur = Number.isFinite(numericRon) && rate ? numericRon / rate : null

  return (
    <div className="space-y-3 text-sm">
      <div className="space-y-1">
        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          {labelRon}
        </Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={localRon}
          onChange={handleRonChange}
          disabled={disabled}
          placeholder="0.00"
          className="bg-slate-800 border-slate-700 text-white"
        />
        {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
        <p className="text-xs text-slate-400">
          {loading && 'Se încarcă rata EUR→RON…'}
          {error && <span className="text-red-300">Eroare rată: {error}</span>}
          {!loading && !error && rate && (
            <span>1 EUR = {rate.toFixed(4)} RON • Sursă: exchangerate.host</span>
          )}
        </p>
        <p className="mt-2 text-sm font-semibold text-white">
          {labelEur}: {eur !== null ? `€${eur.toFixed(2)}` : '—'}
        </p>
      </div>
    </div>
  )
}
