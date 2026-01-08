'use client'

import { useMemo, useState } from 'react'
import {
  CalendarDays,
  Download,
  Filter,
  Loader2,
  ListOrdered,
  Search,
  UserPlus,
  Mail,
  Phone,
} from 'lucide-react'
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
import useSWR from 'swr'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface LeadEventRow {
  id: number
  requestId: number | null
  contactId: number | null
  agentName: string
  agentId: number | null
  clientName: string
  phone: string | null
  email: string | null
  tipProprietate: string | null
  camereMin: number | null
  camereMax: number | null
  bugetMin: number | null
  bugetMax: number | null
  eventTimestamp: string
  createdAt: number
}

interface ParsedLeadEvent {
  id: number
  requestId: number | null
  contactId: number | null
  agentName: string
  agentId: number | null
  clientName: string
  phone: string | null
  email: string | null
  tipProprietate: string | null
  camereMin: number | null
  camereMax: number | null
  bugetMin: number | null
  bugetMax: number | null
  timestamp: string
  date: Date
  year: number
  month: number
}

const fetchLeadEvents = async (): Promise<LeadEventRow[]> => {
  const response = await fetch('/api/admin/lead-events')
  const json = await response.json()
  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch lead events')
  }
  return json.data
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

export const LeadHistoryPanel = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Card className="relative overflow-hidden border-slate-700/60 bg-slate-900/70 p-6 shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,255,0.08),transparent_50%)]" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-xl">
              <UserPlus className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Registru Lead-uri</h2>
              <p className="text-sm text-slate-300">
                Vizualizezi toate lead-urile adăugate prin aplicație.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg transition hover:from-blue-600 hover:to-cyan-600 md:w-auto"
          >
            <ListOrdered className="mr-2 h-4 w-4" />
            Deschide registrul
          </Button>
        </div>
      </Card>

      <LeadHistoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

interface LeadHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

const LeadHistoryModal = ({ isOpen, onClose }: LeadHistoryModalProps) => {
  const { data, isLoading, error } = useSWR('admin/lead-events', fetchLeadEvents, {
    refreshInterval: 30000,
  })
  const [search, setSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState<'all' | string>('all')
  const [selectedMonth, setSelectedMonth] = useState<'all' | string>('all')
  const [selectedPropertyType, setSelectedPropertyType] = useState<'all' | string>('all')

  const leads = useMemo<ParsedLeadEvent[]>(() => {
    if (!data) {
      return []
    }

    return data
      .map((row) => {
        const date = new Date(row.eventTimestamp)
        return {
          id: row.id,
          requestId: row.requestId,
          contactId: row.contactId,
          agentName: row.agentName,
          agentId: row.agentId,
          clientName: row.clientName,
          phone: row.phone,
          email: row.email,
          tipProprietate: row.tipProprietate,
          camereMin: row.camereMin,
          camereMax: row.camereMax,
          bugetMin: row.bugetMin,
          bugetMax: row.bugetMax,
          timestamp: row.eventTimestamp,
          date,
          year: date.getFullYear(),
          month: date.getMonth() + 1,
        }
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [data])

  const availableYears = useMemo(() => {
    const uniqueYears = Array.from(new Set(leads.map(lead => lead.year)))
    return uniqueYears.sort((a, b) => b - a).map(year => year.toString())
  }, [leads])

  const availablePropertyTypes = useMemo(() => {
    const types = Array.from(new Set(leads.map(lead => lead.tipProprietate).filter((type): type is string => Boolean(type))))
    return types.sort()
  }, [leads])

  const filteredLeads = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()

    return leads.filter(lead => {
      if (selectedYear !== 'all' && lead.year.toString() !== selectedYear) {
        return false
      }
      if (selectedMonth !== 'all' && lead.month.toString() !== selectedMonth) {
        return false
      }
      if (selectedPropertyType !== 'all' && lead.tipProprietate !== selectedPropertyType) {
        return false
      }
      if (searchTerm && !lead.clientName.toLowerCase().includes(searchTerm) && 
          !lead.agentName.toLowerCase().includes(searchTerm) &&
          !(lead.phone?.toLowerCase().includes(searchTerm)) &&
          !(lead.email?.toLowerCase().includes(searchTerm))) {
        return false
      }
      return true
    })
  }, [leads, selectedYear, selectedMonth, selectedPropertyType, search])

  const summary = useMemo(() => {
    return filteredLeads.reduce(
      (acc, lead) => {
        acc.count += 1
        if (lead.bugetMin) acc.totalBudgetMin += lead.bugetMin
        if (lead.bugetMax) acc.totalBudgetMax += lead.bugetMax
        return acc
      },
      { count: 0, totalBudgetMin: 0, totalBudgetMax: 0 }
    )
  }, [filteredLeads])

  const handleResetFilters = () => {
    setSearch('')
    setSelectedYear('all')
    setSelectedMonth('all')
    setSelectedPropertyType('all')
  }

  const handleDownloadCsv = () => {
    const header = ['Data', 'Agent', 'Client', 'Telefon', 'Email', 'Tip Proprietate', 'Camere', 'Buget', 'Request ID'].join(',')
    const rows = filteredLeads
      .map(lead => {
        const rooms = lead.camereMin || lead.camereMax 
          ? `${lead.camereMin || '?'} - ${lead.camereMax || '?'}`
          : '—'
        const budget = lead.bugetMin || lead.bugetMax
          ? `€${lead.bugetMin || '?'} - €${lead.bugetMax || '?'}`
          : '—'
        return [
          lead.timestamp,
          `"${lead.agentName}"`,
          `"${lead.clientName}"`,
          lead.phone || '—',
          lead.email || '—',
          lead.tipProprietate || '—',
          rooms,
          budget,
          lead.requestId || '—',
        ].join(',')
      })
      .join('\n')

    const csvContent = `${header}\n${rows}`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'registru-lead-uri.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-6xl flex-col overflow-hidden border-slate-700 bg-slate-900 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Registru Lead-uri</DialogTitle>
          <DialogDescription className="text-sm text-slate-300">
            Vizualizezi și exporți toate lead-urile adăugate prin aplicație.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-full pr-4">
        <div className="space-y-6 pb-6">
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 shadow-inner">
            <div className="md:hidden space-y-2 p-2">
              {isLoading && (
                <div className="py-6 text-center text-slate-400">
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Se încarcă lead-urile...
                  </span>
                </div>
              )}
              {!isLoading && error && (
                <p className="py-4 text-center text-red-400 text-sm">Nu am putut încărca lead-urile.</p>
              )}
              {!isLoading && !error && filteredLeads.length === 0 && (
                <p className="py-4 text-center text-slate-400 text-sm">Niciun lead pentru filtrele selectate.</p>
              )}
              {!isLoading &&
                !error &&
                filteredLeads.map((lead, index) => (
                  <div
                    key={`mobile-${lead.id}-${lead.timestamp}-${index}`}
                    className="rounded-xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{lead.clientName}</p>
                        <p className="text-xs text-slate-400">{dateFormatter.format(lead.date)}</p>
                        <p className="text-xs text-slate-500 mt-1">Agent: {lead.agentName}</p>
                      </div>
                      {lead.tipProprietate && (
                        <Badge className="bg-blue-500/15 text-blue-300 text-[10px]">
                          {lead.tipProprietate}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      {lead.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </span>
                      )}
                      {lead.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </span>
                      )}
                    </div>
                    {(lead.camereMin || lead.camereMax || lead.bugetMin || lead.bugetMax) && (
                      <div className="mt-2 text-xs text-slate-500">
                        {lead.camereMin || lead.camereMax ? `Camere: ${lead.camereMin || '?'} - ${lead.camereMax || '?'}` : ''}
                        {lead.camereMin || lead.camereMax ? ' • ' : ''}
                        {lead.bugetMin || lead.bugetMax ? `Buget: €${lead.bugetMin || '?'} - €${lead.bugetMax || '?'}` : ''}
                      </div>
                    )}
                  </div>
                ))}
            </div>
            <div className="hidden md:block max-h-[50vh] overflow-auto">
              <div className="min-w-full overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm text-slate-200">
                <thead className="sticky top-0 z-10 bg-slate-900/95 text-xs uppercase tracking-wide text-slate-400 backdrop-blur">
                  <tr className="border-b border-slate-700/50">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Agent</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Telefon</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Tip Proprietate</th>
                    <th className="px-4 py-3">Camere</th>
                    <th className="px-4 py-3">Buget</th>
                    <th className="px-4 py-3">Request ID</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <span className="inline-flex items-center gap-2 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Se încarcă lead-urile...
                        </span>
                      </td>
                    </tr>
                  )}
                  {!isLoading && error && (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-red-400">
                        Nu am putut încărca lead-urile. Încearcă din nou.
                      </td>
                    </tr>
                  )}
                  {!isLoading && !error && filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400">
                        Niciun lead pentru filtrele selectate.
                      </td>
                    </tr>
                  )}
                  {!isLoading &&
                    !error &&
                    filteredLeads.map((lead, index) => (
                      <tr
                        key={`${lead.id}-${lead.timestamp}-${index}`}
                        className="border-b border-slate-800/60 last:border-none hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-3 text-xs text-slate-500">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-white">
                          {dateFormatter.format(lead.date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-200">{lead.agentName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-white font-medium">{lead.clientName}</td>
                        <td className="px-4 py-3 text-slate-300">
                          {lead.phone ? (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {lead.email ? (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {lead.tipProprietate ? (
                            <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-blue-500/15 text-blue-300">
                              {lead.tipProprietate}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {lead.camereMin || lead.camereMax
                            ? `${lead.camereMin || '?'} - ${lead.camereMax || '?'}`
                            : <span className="text-slate-500">—</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {lead.bugetMin || lead.bugetMax
                            ? `${currencyFormatter.format(lead.bugetMin || 0)} - ${currencyFormatter.format(lead.bugetMax || 0)}`
                            : <span className="text-slate-500">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {lead.requestId ? `#${lead.requestId}` : '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
          <div className="hidden md:block space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-slate-700/80 bg-slate-900/60 p-4">
                <p className="text-xs uppercase text-slate-400">Lead-uri filtrate</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.count}</p>
                <span className="text-xs text-slate-400">
                  din {leads.length} totale
                </span>
              </Card>
              <Card className="border-slate-700/80 bg-slate-900/60 p-4">
                <p className="text-xs uppercase text-slate-400">Buget minim total</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {currencyFormatter.format(summary.totalBudgetMin)}
                </p>
              </Card>
              <Card className="border-slate-700/80 bg-slate-900/60 p-4">
                <p className="text-xs uppercase text-slate-400">Buget maxim total</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {currencyFormatter.format(summary.totalBudgetMax)}
                </p>
              </Card>
            </div>

            <div className="grid gap-3 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <Search className="h-3.5 w-3.5" />
                  Caută client sau agent
                </label>
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nume client, agent, telefon sau email..."
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
                  Tip proprietate
                </label>
                <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType}>
                  <SelectTrigger className="border-slate-700 bg-slate-900/70 text-white">
                    <SelectValue placeholder="Toate tipurile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate tipurile</SelectItem>
                    {availablePropertyTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-slate-400">
                Listele sunt generate din baza de date reală (lead-urile rămân salvate permanent).
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
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                  onClick={handleDownloadCsv}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

