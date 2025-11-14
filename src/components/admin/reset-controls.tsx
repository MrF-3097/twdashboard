'use client'

import { useCallback, useEffect, useState } from 'react'
import { Trash2, AlertTriangle, Loader2, PencilLine, RefreshCw, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLeaderboard } from '@/hooks/use-commissions'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'

type AdminTransaction = {
  id: number
  agent: string
  valoareTranzactie: number
  tipTranzactie: 'Vanzare' | 'Inchiriere'
  comision: number
  comisionPctDecimal: number
  comisionPctPercent: number
  timestamp: string
}

type TransactionEditForm = {
  Agent: string
  'Valoare Tranzactie': number | string
  'Tip Tranzactie': 'Vanzare' | 'Inchiriere'
  'Comision %': number | string
  Comision: number | string
  Timestamp: string
}

const transactionTypeOptions: Array<'Vanzare' | 'Inchiriere'> = ['Vanzare', 'Inchiriere']

const toLocalDateInputValue = (isoString: string) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  const tzOffset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - tzOffset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

const fromLocalDateInputValue = (value: string) => {
  if (!value) return new Date().toISOString()
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return new Date().toISOString()
  return date.toISOString()
}

const normalizeTransaction = (row: any): AdminTransaction => {
  const decimal = typeof row.comisionPctDecimal === 'number'
    ? row.comisionPctDecimal
    : typeof row.comisionPct === 'number'
      ? row.comisionPct
      : 0

  return {
    id: row.id,
    agent: row.agent,
    valoareTranzactie: row.valoareTranzactie,
    tipTranzactie: (row.tipTranzactie || 'Vanzare') as 'Vanzare' | 'Inchiriere',
    comision: row.comision,
    comisionPctDecimal: decimal,
    comisionPctPercent: Number((decimal * 100).toFixed(2)),
    timestamp: row.timestamp,
  }
}

const mapTransactionToForm = (tx: AdminTransaction): TransactionEditForm => ({
  Agent: tx.agent,
  'Valoare Tranzactie': Number(tx.valoareTranzactie.toFixed(2)),
  'Tip Tranzactie': tx.tipTranzactie,
  'Comision %': Number(tx.comisionPctPercent.toFixed(2)),
  Comision: Number(tx.comision.toFixed(2)),
  Timestamp: tx.timestamp,
})

export const ResetControls = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: leaderboardData, refresh } = useLeaderboard()
  const { toast } = useToast()
  const totalTransactions = leaderboardData?.rows.reduce((sum, r) => sum + r.NrTranzactii, 0) || 0

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [transactionsError, setTransactionsError] = useState<string | null>(null)
  const [transactionsList, setTransactionsList] = useState<AdminTransaction[]>([])
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null)
  const [transactionForm, setTransactionForm] = useState<TransactionEditForm | null>(null)
  const [savingTransaction, setSavingTransaction] = useState(false)
  const [deletingTransaction, setDeletingTransaction] = useState(false)

  const loadTransactions = useCallback(async () => {
    setTransactionsLoading(true)
    setTransactionsError(null)
    try {
      const response = await fetch('/api/admin/transactions?limit=200')
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Nu s-au putut încărca tranzacțiile')
      }
      const list: AdminTransaction[] = result.data.transactions.map((row: any) => normalizeTransaction(row))
      setTransactionsList(list)

      if (list.length > 0) {
        const first = list[0]
        setSelectedTransactionId(first.id)
        setTransactionForm(mapTransactionToForm(first))
      } else {
        setSelectedTransactionId(null)
        setTransactionForm(null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Eroare necunoscută la încărcarea tranzacțiilor'
      setTransactionsError(message)
    } finally {
      setTransactionsLoading(false)
    }
  }, [])
  const handleSelectTransaction = (id: number) => {
    setSelectedTransactionId(id)
    const next = transactionsList.find((tx) => tx.id === id)
    if (next) {
      setTransactionForm(mapTransactionToForm(next))
    }
  }

  const handleTransactionFieldChange = (field: keyof TransactionEditForm, value: string | number) => {
    setTransactionForm((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [field]: value,
      }
    })
  }

  const handleTimestampChange = (value: string) => {
    if (!transactionForm) return
    const iso = fromLocalDateInputValue(value)
    setTransactionForm({
      ...transactionForm,
      Timestamp: iso,
    })
  }

  const handleUpdateTransaction = async () => {
    if (!selectedTransactionId || !transactionForm) return
    setSavingTransaction(true)
    setTransactionsError(null)
    try {
      const response = await fetch(`/api/admin/transactions/${selectedTransactionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionForm),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Nu s-a putut actualiza tranzacția')
      }
      const normalized = normalizeTransaction(result.data.transaction)
      setTransactionsList((prev) => prev.map((tx) => (tx.id === selectedTransactionId ? normalized : tx)))
      setTransactionForm(mapTransactionToForm(normalized))
      toast({
        title: 'Tranzacție actualizată',
        description: 'Am salvat modificările și am actualizat clasamentul.',
      })
      await refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Eroare necunoscută la actualizare'
      setTransactionsError(message)
    } finally {
      setSavingTransaction(false)
    }
  }

  const handleDeleteTransaction = async () => {
    if (!selectedTransactionId) return
    const confirmed = confirm('Sigur vrei să ștergi această tranzacție?')
    if (!confirmed) return
    setDeletingTransaction(true)
    setTransactionsError(null)
    try {
      const response = await fetch(`/api/admin/transactions/${selectedTransactionId}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Nu s-a putut șterge tranzacția')
      }
      setTransactionsList((prev) => {
        const remaining = prev.filter((tx) => tx.id !== selectedTransactionId)
        if (remaining.length > 0) {
          const next = remaining[0]
          setSelectedTransactionId(next.id)
          setTransactionForm(mapTransactionToForm(next))
        } else {
          setSelectedTransactionId(null)
          setTransactionForm(null)
        }
        return remaining
      })
      toast({
        title: 'Tranzacție ștearsă',
        description: 'Datele au fost eliminate și clasamentul s-a actualizat.',
      })
      await refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Eroare necunoscută la ștergere'
      setTransactionsError(message)
    } finally {
      setDeletingTransaction(false)
    }
  }

  useEffect(() => {
    if (isEditDialogOpen) {
      loadTransactions()
    } else {
      setTransactionsError(null)
      setTransactionForm(null)
      setSelectedTransactionId(null)
    }
  }, [isEditDialogOpen, loadTransactions])

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

        <div className="mb-4 md:mb-6 space-y-2">
          <Button
            onClick={() => setIsEditDialogOpen(true)}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white h-11 md:h-12 text-sm md:text-base shadow-lg hover:shadow-xl transition-all"
          >
            <PencilLine className="mr-2 h-4 w-4 md:h-5 md:w-5" />
            Modifică Tranzacții
          </Button>
          <p className="text-xs md:text-sm text-red-100/80 text-center">
            Selectează o tranzacție existentă pentru a o edita sau șterge punctual.
          </p>
        </div>

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
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-900 border border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifică tranzacții existente</DialogTitle>
            <DialogDescription className="text-slate-400">
              Alege o tranzacție adăugată anterior pentru a ajusta valorile sau pentru a o șterge complet.
            </DialogDescription>
          </DialogHeader>

          {transactionsError && (
            <div className="mt-3 rounded-lg border border-red-500/60 bg-red-500/10 p-3 text-sm text-red-200">
              {transactionsError}
            </div>
          )}

          <div className="mt-4 space-y-3 max-h-[75vh] overflow-y-auto pr-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="transaction-select" className="text-white/80 text-sm">
                Selectează tranzacția
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadTransactions}
                disabled={transactionsLoading}
                className="border-slate-600 text-slate-200 hover:bg-slate-800"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${transactionsLoading ? 'animate-spin' : ''}`} />
                Reîncarcă
              </Button>
            </div>

            {transactionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              </div>
            ) : transactionsList.length === 0 ? (
              <p className="text-sm text-slate-400">
                Nu există tranzacții înregistrate încă. Adaugă una nouă pentru a o putea modifica ulterior.
              </p>
            ) : (
              <Select
                value={selectedTransactionId ? String(selectedTransactionId) : undefined}
                onValueChange={(value) => handleSelectTransaction(Number(value))}
              >
                <SelectTrigger
                  id="transaction-select"
                  className="bg-slate-800 border-slate-700 text-white h-12 w-full"
                >
                  <SelectValue placeholder="Alege tranzacția" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-[300px]">
                  {transactionsList.map((tx) => (
                    <SelectItem key={tx.id} value={String(tx.id)} className="text-white focus:bg-slate-700">
                      {tx.agent} • €{tx.valoareTranzactie.toLocaleString('ro-RO')} •{' '}
                      {new Date(tx.timestamp).toLocaleDateString('ro-RO')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {transactionForm && (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-agent" className="text-sm text-white/80">
                    Agent
                  </Label>
                  <Input
                    id="edit-agent"
                    value={transactionForm.Agent}
                    onChange={(e) => handleTransactionFieldChange('Agent', e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tip" className="text-sm text-white/80">
                    Tip Tranzacție
                  </Label>
                  <Select
                    value={transactionForm['Tip Tranzactie']}
                    onValueChange={(value) => handleTransactionFieldChange('Tip Tranzactie', value as 'Vanzare' | 'Inchiriere')}
                  >
                    <SelectTrigger id="edit-tip" className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Tip" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {transactionTypeOptions.map((option) => (
                        <SelectItem key={option} value={option} className="text-white focus:bg-slate-700">
                          {option === 'Vanzare' ? 'Vânzare' : 'Închiriere'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-valoare" className="text-sm text-white/80">
                    Valoare Tranzacție (€)
                  </Label>
                  <Input
                    id="edit-valoare"
                    type="number"
                    step="0.01"
                    value={transactionForm['Valoare Tranzactie']}
                    onChange={(e) => handleTransactionFieldChange('Valoare Tranzactie', parseFloat(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-comision-fixed" className="text-sm text-white/80">
                    Comision (€)
                  </Label>
                  <Input
                    id="edit-comision-fixed"
                    type="number"
                    step="0.01"
                    value={transactionForm.Comision}
                    onChange={(e) => handleTransactionFieldChange('Comision', parseFloat(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-comision-pct" className="text-sm text-white/80">
                    Comision %
                  </Label>
                  <Input
                    id="edit-comision-pct"
                    type="number"
                    step="0.01"
                    value={transactionForm['Comision %']}
                    onChange={(e) => handleTransactionFieldChange('Comision %', parseFloat(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-500">
                    Total procentual (poate depăși 100% dacă implică cumpărător + vânzător).
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-timestamp" className="text-sm text-white/80">
                    Dată înregistrare
                  </Label>
                  <Input
                    id="edit-timestamp"
                    type="datetime-local"
                    value={toLocalDateInputValue(transactionForm.Timestamp)}
                    onChange={(e) => handleTimestampChange(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteTransaction}
                  disabled={deletingTransaction}
                  className="flex-1 sm:flex-none sm:w-auto"
                >
                  {deletingTransaction ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Se șterge...
                    </>
                  ) : (
                    <>
                      <Trash className="mr-2 h-4 w-4" />
                      Șterge Tranzacția
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleUpdateTransaction}
                  disabled={savingTransaction}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white sm:flex-none sm:w-auto"
                >
                  {savingTransaction ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Se salvează...
                    </>
                  ) : (
                    'Salvează Modificările'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

