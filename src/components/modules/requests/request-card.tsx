'use client'

import React, { useState } from 'react'
import { Bed, Euro, User, Calendar, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { RequestDetailModal } from './request-detail-modal'
import type { Request } from '@/hooks/use-requests'

interface RequestCardProps {
  request: Request
}

export const RequestCard = ({ request }: RequestCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const formatPrice = (min?: number | null, max?: number | null) => {
    if (min && max) {
      return `${new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(min)} - ${new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(max)}`
    }
    if (min) {
      return `De la ${new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(min)}`
    }
    if (max) {
      return `Până la ${new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(max)}`
    }
    return 'Preț flexibil'
  }

  const formatRooms = (min?: number | null, max?: number | null) => {
    if (min && max) {
      return `${min} - ${max} camere`
    }
    if (min) {
      return `De la ${min} camere`
    }
    if (max) {
      return `Până la ${max} camere`
    }
    return 'Număr camere flexibil'
  }

  const getPropertyTypeLabel = (type?: number | null) => {
    const typeMap: Record<number, string> = {
      1: 'Apartament',
      3: 'Casă/Vilă',
      6: 'Teren',
      4: 'Spațiu birouri',
      5: 'Spațiu comercial',
    }
    return type ? typeMap[type] || 'Nespecificat' : 'Nespecificat'
  }

  const getTransactionTypeLabel = (type?: number | null) => {
    if (type === 1) return 'Închiriere'
    if (type === 2) return 'Vânzare'
    return 'Nespecificat'
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Data necunoscută'
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('ro-RO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date)
    } catch {
      return 'Data necunoscută'
    }
  }

  const getAgentName = () => {
    if (typeof request.agent === 'object' && request.agent?.name) {
      return request.agent.name
    }
    if (typeof request.agent === 'number') {
      return `Agent #${request.agent}`
    }
    return 'Fără agent'
  }

  return (
    <>
      <Card 
        className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 transition-all overflow-hidden group cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate mb-1">
              {request.title || `Cerere #${request.display_id || request.id}`}
            </h3>
            {request.display_id && (
              <p className="text-xs text-slate-400">ID: {request.display_id}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {request.transaction_type && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                request.transaction_type === 2
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-sky-500/15 text-sky-300'
              }`}>
                {getTransactionTypeLabel(request.transaction_type)}
              </span>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {request.property_type && (
            <div className="flex items-center gap-2 text-slate-300">
              <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">{getPropertyTypeLabel(request.property_type)}</span>
            </div>
          )}
          
          {(request.rooms_filter_gte || request.rooms_filter_lte) && (
            <div className="flex items-center gap-2 text-slate-300">
              <Bed className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">
                {formatRooms(request.rooms_filter_gte, request.rooms_filter_lte)}
              </span>
            </div>
          )}
          
          {(request.price_filter_gte || request.price_filter_lte) && (
            <div className="flex items-center gap-2 text-slate-300 col-span-2">
              <Euro className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">
                {formatPrice(request.price_filter_gte, request.price_filter_lte)}
              </span>
            </div>
          )}
        </div>

        {/* Agent and Date */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <User className="h-3.5 w-3.5" />
            <span className="truncate">{getAgentName()}</span>
          </div>
          {request.date_added && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(request.date_added)}</span>
            </div>
          )}
        </div>

        {/* Details/Comments */}
        {request.details && (
          <div className="pt-2 border-t border-slate-700/50">
            <p className="text-xs text-slate-400 line-clamp-2">{request.details}</p>
          </div>
        )}
      </div>
    </Card>

    <RequestDetailModal
      request={request}
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
    />
    </>
  )
}

