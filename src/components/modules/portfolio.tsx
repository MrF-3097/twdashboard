'use client'

import React, { useState, useMemo } from 'react'
import { useProperties } from '@/hooks/use-properties'
import { PropertyCard } from '@/components/modules/properties/property-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Loader2, Filter, X } from 'lucide-react'

/**
 * Portfolio Component
 * 
 * Displays all properties from the entire agency portfolio with filtering capabilities:
 * - Transaction type (Vânzare / Închiriere)
 * - Property type (Apartament, Casă/Vilă, Teren, Spațiu birouri, Spațiu comercial)
 * - Room number (bedrooms)
 * - Max price (price_sale or price_rent)
 * 
 * Note: Shows ALL properties from ALL agents (entire agency portfolio)
 */
export const Portfolio = () => {
  const { properties, isLoading, isError } = useProperties()
  
  // Filter states
  const [propertyType, setPropertyType] = useState<string>('all')
  const [roomNumber, setRoomNumber] = useState<string>('all')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [transactionType, setTransactionType] = useState<string>('all')

  // Property type mapping from REBS API
  const propertyTypeMap: Record<number, string> = {
    1: 'Apartament',
    3: 'Casă/Vilă',
    6: 'Teren',
    4: 'Spațiu birouri',
    5: 'Spațiu comercial',
  }

  // Filter properties by filters (NO agent filter - shows all agency properties)
  const filteredProperties = useMemo(() => {
    let filtered = properties.filter((property: any) => {

      // Filter by transaction type
      if (transactionType !== 'all') {
        if (transactionType === 'vanzare') {
          // For sale: must have for_sale=true OR price_sale > 0
          if (!property.for_sale && (!property.price_sale || property.price_sale === 0)) {
            return false
          }
        } else if (transactionType === 'chirie') {
          // For rent: must have for_rent=true OR price_rent > 0
          if (!property.for_rent && (!property.price_rent || property.price_rent === 0)) {
            return false
          }
        }
      }

      // Filter by property type
      if (propertyType !== 'all') {
        const typeId = parseInt(propertyType)
        if (property.property_type !== typeId) {
          return false
        }
      }

      // Filter by room number
      if (roomNumber !== 'all') {
        const rooms = parseInt(roomNumber)
        if (property.bedrooms !== rooms) {
          return false
        }
      }

      // Filter by max price
      if (maxPrice && maxPrice.trim() !== '') {
        const maxPriceNum = parseFloat(maxPrice.replace(/[^\d.]/g, ''))
        if (!isNaN(maxPriceNum)) {
          // Use appropriate price based on transaction type filter
          let propertyPrice = 0
          if (transactionType === 'vanzare') {
            propertyPrice = property.price_sale || 0
          } else if (transactionType === 'chirie') {
            propertyPrice = property.price_rent || 0
          } else {
            // If no transaction type filter, check both prices and use the higher one
            propertyPrice = Math.max(property.price_sale || 0, property.price_rent || 0)
          }
          
          if (propertyPrice > maxPriceNum) {
            return false
          }
        }
      }

      return true
    })

    return filtered
  }, [properties, propertyType, roomNumber, maxPrice, transactionType])

  const handleClearFilters = () => {
    setPropertyType('all')
    setRoomNumber('all')
    setMaxPrice('')
    setTransactionType('all')
  }

  const hasActiveFilters = propertyType !== 'all' || roomNumber !== 'all' || (maxPrice && maxPrice.trim() !== '') || transactionType !== 'all'

  return (
    <div className="w-full space-y-6">
      {/* Filters Section */}
      <Card className="bg-transparent border border-white/20 p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-white" />
          <h3 className="text-lg font-semibold text-white">Filtrează Portofoliul</h3>
          {hasActiveFilters && (
            <Button
              onClick={handleClearFilters}
              variant="ghost"
              size="sm"
              className="ml-auto h-8 px-2 text-xs text-slate-400 hover:text-white"
            >
              <X className="h-3 w-3 mr-1" />
              Resetează
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Transaction Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="transaction-type" className="text-sm text-white/70">
              Tip Tranzacție
            </Label>
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger 
                id="transaction-type"
                className="bg-slate-800 border-slate-700 text-white"
              >
                <SelectValue placeholder="Toate" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white hover:bg-slate-700">
                  Toate
                </SelectItem>
                <SelectItem value="vanzare" className="text-white hover:bg-slate-700">
                  Vânzare
                </SelectItem>
                <SelectItem value="chirie" className="text-white hover:bg-slate-700">
                  Închiriere
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Property Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="property-type" className="text-sm text-white/70">
              Tip Proprietate
            </Label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger 
                id="property-type"
                className="bg-slate-800 border-slate-700 text-white"
              >
                <SelectValue placeholder="Toate tipurile" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white hover:bg-slate-700">
                  Toate tipurile
                </SelectItem>
                {Object.entries(propertyTypeMap).map(([id, name]) => (
                  <SelectItem 
                    key={id} 
                    value={id}
                    className="text-white hover:bg-slate-700"
                  >
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room Number Filter */}
          <div className="space-y-2">
            <Label htmlFor="room-number" className="text-sm text-white/70">
              Număr Camere
            </Label>
            <Select value={roomNumber} onValueChange={setRoomNumber}>
              <SelectTrigger 
                id="room-number"
                className="bg-slate-800 border-slate-700 text-white"
              >
                <SelectValue placeholder="Toate" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white hover:bg-slate-700">
                  Toate
                </SelectItem>
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <SelectItem 
                    key={num} 
                    value={num.toString()}
                    className="text-white hover:bg-slate-700"
                  >
                    {num} {num === 1 ? 'cameră' : 'camere'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Max Price Filter */}
          <div className="space-y-2">
            <Label htmlFor="max-price" className="text-sm text-white/70">
              Preț Maxim (EUR)
            </Label>
            <Input
              id="max-price"
              type="text"
              placeholder="Ex: 150000"
              value={maxPrice}
              onChange={(e) => {
                // Allow only numbers
                const value = e.target.value.replace(/[^\d]/g, '')
                setMaxPrice(value)
              }}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Results Count */}
        {!isLoading && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-sm text-white/70">
              {filteredProperties.length === 0 ? (
                'Nu s-au găsit proprietăți care să corespundă filtrelor'
              ) : (
                <>
                  <span className="font-semibold text-white">{filteredProperties.length}</span>
                  {' '}
                  {filteredProperties.length === 1 ? 'proprietate găsită' : 'proprietăți găsite'}
                </>
              )}
            </p>
          </div>
        )}
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
          <p className="text-slate-400">Se încarcă portofoliul...</p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-red-400" />
          </div>
          <p className="text-red-400 font-semibold mb-2">Eroare la încărcare</p>
          <p className="text-slate-400 text-sm text-center max-w-sm">
            Nu s-au putut încărca proprietățile. Te rugăm să încerci din nou mai târziu.
          </p>
        </div>
      )}

      {/* Properties Grid */}
      {!isLoading && !isError && filteredProperties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredProperties.length === 0 && properties.length > 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-400 font-semibold mb-2">Nu s-au găsit proprietăți</p>
          <p className="text-slate-500 text-sm text-center max-w-sm">
            Nu există proprietăți care să corespundă filtrelor selectate.
          </p>
          {hasActiveFilters && (
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="mt-4 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Resetează filtrele
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

