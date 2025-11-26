'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, Download, Filter, Loader2, ListOrdered, Search, Table } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTransactions } from '@/hooks/use-commissions'

type TransactionType = 'Inchiriere' | 'Vanzare'

interface ParsedTransaction {
  id: number
  agent: string
  value: number
  type: TransactionType
  commissionPct: number
  commission: number
  timestamp: string
  date: Date
  year: number
  month: number
}

const monthLabels = [
  { value: '1', label: 'Ianuarie' },
  { value: '2', label: 'Februarie' },
  { value: '3', label: 'Martie' },
  { value: '4', label: 'Aprilie' },
  { value: '5', label: 'Mai' },
  { value: '6', label: 'Iunie' },
  { value: '7', label: 'Iulie' },
  { value: '8', label: 'August' },
  { value: '9', label: 'Septembrie' },
  { value: '10', label: 'Octombrie' },
  { value: '11', label: 'Noiembrie' },
  { value: '12', label: 'Decembrie' },
]

const currencyFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('ro-RO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export const TransactionHistoryPanel = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Card className="relative overflow-hidden border-slate-700/60 bg-slate-900/70 p-6 shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,255,0.08),transparent_50%)]" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-xl">
              <Table className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Registru Tranzacții</h2>
              <p className="text-sm text-slate-300">
                Vizualizezi toate tranzacțiile în format tabelar, inclusiv cele eliminate din clasament.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg transition hover:from-emerald-600 hover:to-cyan-600 md:w-auto"
          >
            <ListOrdered className="mr-2 h-4 w-4" />
            Deschide registrul
          </Button>
        </div>
      </Card>

      <TransactionHistoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

interface TransactionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

const TransactionHistoryModal = ({ isOpen, onClose }: TransactionHistoryModalProps) => {
  const { data, isLoading, error } = useTransactions()
  const [search, setSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState<'all' | string>('all')
  const [selectedMonth, setSelectedMonth] = useState<'all' | string>('all')
  const [selectedType, setSelectedType] = useState<'all' | TransactionType>('all')

  const transactions = useMemo<ParsedTransaction[]>(() => {
    if (!data?.rows) {
      return []
    }

    return data.rows
      .map((row, index) => {
        const date = new Date(row.Timestamp)
        return {
          id: index,
          agent: row.Agent,
          value: Number(row['Valoare Tranzactie']) || 0,
          type: row['Tip Tranzactie'],
          commissionPct: typeof row['Comision %'] === 'number' ? row['Comision %'] : 0,
          commission: Number(row.Comision) || 0,
          timestamp: row.Timestamp,
          date,
          year: date.getFullYear(),
          month: date.getMonth() + 1,
        }
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [data])

  const availableYears = useMemo(() => {
    const uniqueYears = Array.from(new Set(transactions.map(tx => tx.year)))
    return uniqueYears.sort((a, b) => b - a).map(year => year.toString())
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()

    return transactions.filter(tx => {
      if (selectedYear !== 'all' && tx.year.toString() !== selectedYear) {
        return false
      }
      if (selectedMonth !== 'all' && tx.month.toString() !== selectedMonth) {
        return false
      }
      if (selectedType !== 'all' && tx.type !== selectedType) {
        return false
      }
      if (searchTerm && !tx.agent.toLowerCase().includes(searchTerm)) {
        return false
      }
      return true
    })
  }, [transactions, selectedYear, selectedMonth, selectedType, search])

  const summary = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        acc.count += 1
        acc.value += tx.value
        acc.commission += tx.commission
        return acc
      },
      { count: 0, value: 0, commission: 0 }
    )
  }, [filteredTransactions])

  const handleResetFilters = () => {
    setSearch('')
    setSelectedYear('all')
    setSelectedMonth('all')
    setSelectedType('all')
  }

  const handleDownloadCsv = () => {
    const header = ['Agent', 'Tip', 'Valoare', 'Comision %', 'Comision', 'Timestamp'].join(',')
    const rows = filteredTransactions
      .map(tx =>
        [
          `"${tx.agent}"`,
          tx.type,
          tx.value.toFixed(2),
          (tx.commissionPct * 100).toFixed(2),
          tx.commission.toFixed(2),
          tx.timestamp,
        ].join(',')
      )
      .join('\n')

    const csvContent = `${header}\n${rows}`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'registru-tranzactii.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-6xl overflow-hidden border-slate-700 bg-slate-900 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Registru Tranzacții</DialogTitle>
          <DialogDescription className="text-sm text-slate-300">
            Vizualizezi și exporți toate tranzacțiile introduse. Datele rămân salvate chiar dacă modifici clasamentul.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-slate-700/80 bg-slate-900/60 p-4">
              <p className="text-xs uppercase text-slate-400">Tranzacții filtrate</p>
              <p className="mt-2 text-2xl font-semibold text-white">{summary.count}</p>
              <span className="text-xs text-slate-400">
                din {transactions.length} totale
              </span>
            </Card>
            <Card className="border-slate-700/80 bg-slate-900/60 p-4">
              <p className="text-xs uppercase text-slate-400">Valoare tranzacții</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {currencyFormatter.format(summary.value)}
              </p>
            </Card>
            <Card className="border-slate-700/80 bg-slate-900/60 p-4">
              <p className="text-xs uppercase text-slate-400">Comisioane totale</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {currencyFormatter.format(summary.commission)}
              </p>
            </Card>
          </div>

          <div className="grid gap-3 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Search className="h-3.5 w-3.5" />
                Caută agent
              </label>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nume agent..."
                className="border-slate-700 bg-slate-900/70 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" />
                An
              </label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="border-slate-700 bg-slate-900/70 text-white">
                  <SelectValue placeholder="Toți anii" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toți anii</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" />
                Lună
              </label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="border-slate-700 bg-slate-900/70 text-white">
                  <SelectValue placeholder="Toate lunile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate lunile</SelectItem>
                  {monthLabels.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Filter className="h-3.5 w-3.5" />
                Tip tranzacție
              </label>
              <Select value={selectedType} onValueChange={value => setSelectedType(value as typeof selectedType)}>
                <SelectTrigger className="border-slate-700 bg-slate-900/70 text-white">
                  <SelectValue placeholder="Toate tipurile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate tipurile</SelectItem>
                  <SelectItem value="Vanzare">Vânzare</SelectItem>
                  <SelectItem value="Inchiriere">Închiriere</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-slate-400">
              Listele sunt generate din baza de date reală (tranzacțiile rămân chiar dacă sunt eliminate din leaderboard).
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="border-slate-600 text-slate-200"
                onClick={handleResetFilters}
              >
                Resetează filtrele
              </Button>
              <Button
                variant="outline"
                className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                onClick={handleDownloadCsv}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 shadow-inner">
            <div className="max-h-[50vh] overflow-auto">
              <table className="min-w-[1100px] w-full text-left text-sm text-slate-200">
                <thead className="sticky top-0 z-10 bg-slate-900/95 text-xs uppercase tracking-wide text-slate-400 backdrop-blur">
                  <tr className="border-b border-slate-700/50">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Agent</th>
                    <th className="px-4 py-3">Tip</th>
                    <th className="px-4 py-3">Valoare (€)</th>
                    <th className="px-4 py-3">Comision %</th>
                    <th className="px-4 py-3">Comision (€)</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <span className="inline-flex items-center gap-2 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Se încarcă tranzacțiile...
                        </span>
                      </td>
                    </tr>
                  )}
                  {!isLoading && error && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-red-400">
                        Nu am putut încărca tranzacțiile. Încearcă din nou.
                      </td>
                    </tr>
                  )}
                  {!isLoading && !error && filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        Nicio tranzacție pentru filtrele selectate.
                      </td>
                    </tr>
                  )}
                  {!isLoading &&
                    !error &&
                    filteredTransactions.map((tx, index) => (
                      <tr
                        key={`${tx.agent}-${tx.timestamp}-${index}`}
                        className="border-b border-slate-800/60 last:border-none hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-3 text-xs text-slate-500">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-white">
                          {dateFormatter.format(tx.date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-200">{tx.agent}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              tx.type === 'Vanzare'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-sky-500/15 text-sky-300'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-white">
                          {currencyFormatter.format(tx.value)}
                        </td>
                        <td className="px-4 py-3 text-slate-200">
                          {`${(tx.commissionPct * 100).toFixed(2)}%`}
                        </td>
                        <td className="px-4 py-3 font-semibold text-amber-300">
                          {currencyFormatter.format(tx.commission)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


