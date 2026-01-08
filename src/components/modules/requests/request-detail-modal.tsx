'use client'

import React, { useMemo } from 'react'
import { X, Bed, Euro, User, Calendar, FileText, Phone, Mail, Building2, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PropertyCard } from '@/components/modules/properties/property-card'
import { useProperties } from '@/hooks/use-properties'
import type { Request } from '@/hooks/use-requests'

interface RequestDetailModalProps {
  request: Request | null
  isOpen: boolean
  onClose: () => void
}

export const RequestDetailModal = ({ request, isOpen, onClose }: RequestDetailModalProps) => {
  const { properties } = useProperties()

  // Flexible property matching logic
  const matchingProperties = useMemo(() => {
    if (!request || !properties.length) return []

    return properties.filter((property: any) => {
      // Match transaction type
      if (request.transaction_type) {
        if (request.transaction_type === 2) {
          // Sale: property must be for sale
          if (!property.for_sale && (!property.price_sale || property.price_sale === 0)) {
            return false
          }
        } else if (request.transaction_type === 1) {
          // Rent: property must be for rent
          if (!property.for_rent && (!property.price_rent || property.price_rent === 0)) {
            return false
          }
        }
      }

      // Match property type
      if (request.property_type && property.property_type !== request.property_type) {
        return false
      }

      // Flexible price matching: within budget OR up to 10,000 EUR more
      if (request.price_filter_lte) {
        const maxRequestPrice = request.price_filter_lte
        const maxAllowedPrice = maxRequestPrice + 10000 // Allow up to 10k more
        
        let propertyPrice = 0
        if (request.transaction_type === 2) {
          propertyPrice = property.price_sale || 0
        } else if (request.transaction_type === 1) {
          propertyPrice = property.price_rent || 0
        } else {
          // If no transaction type specified, check both
          propertyPrice = Math.max(property.price_sale || 0, property.price_rent || 0)
        }

        // Property must be within budget OR up to 10k more
        if (propertyPrice > maxAllowedPrice) {
          return false
        }
        // Also check minimum price if specified
        if (request.price_filter_gte && propertyPrice < request.price_filter_gte) {
          return false
        }
      } else if (request.price_filter_gte) {
        // Only minimum price specified
        let propertyPrice = 0
        if (request.transaction_type === 2) {
          propertyPrice = property.price_sale || 0
        } else if (request.transaction_type === 1) {
          propertyPrice = property.price_rent || 0
        } else {
          propertyPrice = Math.max(property.price_sale || 0, property.price_rent || 0)
        }
        
        if (propertyPrice < request.price_filter_gte) {
          return false
        }
      }

      // Flexible room matching: if requesting N rooms, also show N+1 rooms
      // In Romania: rooms = bedrooms + living room, so 3 rooms = 2 bedrooms
      // Property has "bedrooms" field, so we convert: total rooms = bedrooms + 1
      if (request.rooms_filter_gte || request.rooms_filter_lte) {
        const propertyBedrooms = property.bedrooms || 0
        // Convert property bedrooms to total rooms (bedrooms + 1 for living room)
        // Example: 2 bedrooms = 3 rooms total (2 bedrooms + 1 living room)
        const propertyTotalRooms = propertyBedrooms + 1

        if (request.rooms_filter_gte && request.rooms_filter_lte) {
          // Range specified: show properties within range OR one room more
          // If requesting 3-4 rooms, show properties with 3, 4, or 5 rooms
          const minRequestRooms = request.rooms_filter_gte
          const maxRequestRooms = request.rooms_filter_lte + 1 // Allow one more room
          
          if (propertyTotalRooms < minRequestRooms || propertyTotalRooms > maxRequestRooms) {
            return false
          }
        } else if (request.rooms_filter_gte) {
          // Minimum rooms specified: show properties with at least that many OR one more
          // If requesting minimum 3 rooms, show properties with 3 or 4 rooms
          const minRequestRooms = request.rooms_filter_gte
          if (propertyTotalRooms < minRequestRooms) {
            return false
          }
          // Allow up to one more room
          if (propertyTotalRooms > minRequestRooms + 1) {
            return false
          }
        } else if (request.rooms_filter_lte) {
          // Maximum rooms specified: show properties up to that many OR one more
          // If requesting maximum 3 rooms, show properties with 3 or 4 rooms
          const maxRequestRooms = request.rooms_filter_lte + 1 // Allow one more room
          if (propertyTotalRooms > maxRequestRooms) {
            return false
          }
        }
      }

      // Only show active properties
      const availability = property.availability ?? property.active
      if (availability !== 1 && availability !== true && availability !== '1') {
        return false
      }

      return true
    })
  }, [request, properties])

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
    if (typeof request?.agent === 'object' && request.agent?.name) {
      return request.agent.name
    }
    if (typeof request?.agent === 'number') {
      return `Agent #${request.agent}`
    }
    return 'Fără agent'
  }

  const handleWhatsAppShare = () => {
    if (!request) return
    
    const title = request.title || `Cerere #${request.display_id || request.id}`
    const transactionType = getTransactionTypeLabel(request.transaction_type)
    const propertyType = getPropertyTypeLabel(request.property_type)
    const rooms = formatRooms(request.rooms_filter_gte, request.rooms_filter_lte)
    const price = formatPrice(request.price_filter_gte, request.price_filter_lte)
    const agent = getAgentName()
    
    // Build the message
    let message = `*${title}*\n\n`
    message += `Tip tranzacție: ${transactionType}\n`
    if (propertyType !== 'Nespecificat') {
      message += `Tip proprietate: ${propertyType}\n`
    }
    if (rooms !== 'Număr camere flexibil') {
      message += `Camere: ${rooms}\n`
    }
    message += `Preț: ${price}\n`
    
    // Add location if available (from cities or other fields)
    if (request.cities && request.cities.length > 0) {
      message += `Locație: ${request.cities.join(', ')}\n`
    }
    
    // Add agent if available
    if (agent !== 'Fără agent') {
      message += `Agent: ${agent}\n`
    }
    
    // Add details/comments if available
    if (request.details) {
      message += `\nDetalii:\n${request.details}\n`
    }
    if (request.comments_general) {
      message += `\nComentarii:\n${request.comments_general}\n`
    }
    
    message += `\nInteresat de această cerere?`
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  if (!request) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1003]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-6xl md:h-[90vh] md:max-h-[90vh] z-[1004] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/50">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {request.title || `Cerere #${request.display_id || request.id}`}
                </h2>
                {request.display_id && (
                  <p className="text-sm text-slate-400">ID: {request.display_id}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleWhatsAppShare}
                  variant="outline"
                  size="sm"
                  className="bg-green-600/10 hover:bg-green-600/20 border-green-600/30 text-green-400 hover:text-green-300"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  <span>Trimite pe WhatsApp</span>
                </Button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-6 space-y-6">
                {/* Request Details */}
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Detalii Cerere
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Transaction Type */}
                    {request.transaction_type && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-700/50">
                          <FileText className="h-4 w-4 text-slate-300" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Tip Tranzacție</p>
                          <p className="text-sm font-medium text-white">
                            {getTransactionTypeLabel(request.transaction_type)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Property Type */}
                    {request.property_type && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-700/50">
                          <Building2 className="h-4 w-4 text-slate-300" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Tip Proprietate</p>
                          <p className="text-sm font-medium text-white">
                            {getPropertyTypeLabel(request.property_type)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Rooms */}
                    {(request.rooms_filter_gte || request.rooms_filter_lte) && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-700/50">
                          <Bed className="h-4 w-4 text-slate-300" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Număr Camere</p>
                          <p className="text-sm font-medium text-white">
                            {formatRooms(request.rooms_filter_gte, request.rooms_filter_lte)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Price */}
                    {(request.price_filter_gte || request.price_filter_lte) && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-700/50">
                          <Euro className="h-4 w-4 text-slate-300" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Buget</p>
                          <p className="text-sm font-medium text-white">
                            {formatPrice(request.price_filter_gte, request.price_filter_lte)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Agent */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-700/50">
                        <User className="h-4 w-4 text-slate-300" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Agent</p>
                        <p className="text-sm font-medium text-white">{getAgentName()}</p>
                      </div>
                    </div>

                    {/* Date */}
                    {request.date_added && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-700/50">
                          <Calendar className="h-4 w-4 text-slate-300" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Data Adăugării</p>
                          <p className="text-sm font-medium text-white">
                            {formatDate(request.date_added)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Details/Comments */}
                  {request.details && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <p className="text-xs text-slate-400 mb-2">Detalii</p>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{request.details}</p>
                    </div>
                  )}
                </Card>

                {/* Matching Properties */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Proprietăți Potrivite ({matchingProperties.length})
                  </h3>

                  {matchingProperties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {matchingProperties.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
                      <Building2 className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400 font-medium mb-2">
                        Nu s-au găsit proprietăți potrivite
                      </p>
                      <p className="text-sm text-slate-500">
                        Încearcă să ajustezi criteriile cererii pentru a găsi mai multe opțiuni.
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

