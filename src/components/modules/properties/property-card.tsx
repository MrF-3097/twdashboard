'use client'

import React from 'react'
import { Bed, Bath, Square, MessageCircle, Image as ImageIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { Property } from '@/hooks/use-properties'
import { usePropertyImages } from '@/hooks/use-property-images'

interface PropertyCardProps {
  property: Property
}

export const PropertyCard = ({ property }: PropertyCardProps) => {
  // Fetch images from new /api/properties/{id}/images/ endpoint
  const { firstImage: fetchedImage, isLoading: imagesLoading } = usePropertyImages(property.id, true)

  // Get first image with fallback priority:
  // 1. Fetched image from /api/properties/{id}/images/ (new API)
  // 2. Legacy fields (resized_images, full_images, thumbnail) for backward compatibility
  const getFirstImage = () => {
    if (fetchedImage) {
      return fetchedImage
    }
    if (property.resized_images && Array.isArray(property.resized_images) && property.resized_images.length > 0) {
      return property.resized_images[0]
    }
    if (property.full_images && Array.isArray(property.full_images) && property.full_images.length > 0) {
      return property.full_images[0]
    }
    if (property.thumbnail) {
      return property.thumbnail
    }
    return null
  }

  const firstImage = getFirstImage()
  const [imageError, setImageError] = React.useState(false)
  const formatPrice = (salePrice?: number | null, rentPrice?: number | null) => {
    if (salePrice && salePrice > 0) {
      return new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(salePrice)
    }
    if (rentPrice && rentPrice > 0) {
      return `${new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(rentPrice)}/lună`
    }
    return 'Preț pe cerere'
  }

  const formatSurface = (surface?: number | null) => {
    if (!surface || surface === 0) return null
    return `${Math.round(surface)} m²`
  }

  // Get surface area: use surface_useable only
  const getSurface = () => {
    if (property.surface_useable && property.surface_useable > 0) {
      return formatSurface(property.surface_useable)
    }
    return null
  }

  const getPropertyTitle = () => {
    if (property.title) return property.title
    if (property.name) return property.name
    if (property.address) return property.address
    return `Proprietate #${property.id}`
  }

  const getLocation = () => {
    const parts = []
    if (property.address) parts.push(property.address)
    if (property.zone) parts.push(property.zone)
    if (property.city) parts.push(property.city)
    return parts.join(', ') || ''
  }

  // Generate Tower Imob property URL based on property details
  const generatePropertyUrl = (): string => {
    const baseUrl = 'https://www.towerimob.ro/'
    
    // Property type mapping (from REBS API property_type field)
    // 1 = Apartament, 3 = Casă/Vilă, 6 = Teren, 4 = Spațiu birouri, 5 = Spațiu comercial
    const propertyTypeMap: Record<number, string> = {
      1: 'apartament',
      3: 'casa-vila',
      6: 'teren',
      4: 'spatiu-de-birouri',
      5: 'spatiu-comercial',
    }
    
    // Determine if it's for sale or rent
    const isForRent = property.for_rent || (!property.for_sale && property.price_rent)
    const isForSale = property.for_sale || (!property.for_rent && property.price_sale)
    
    // Get property type slug
    const propertyTypeId = property.property_type as number
    let propertyTypeSlug = 'proprietate' // default fallback
    if (propertyTypeId && propertyTypeMap[propertyTypeId]) {
      propertyTypeSlug = propertyTypeMap[propertyTypeId]
    }
    
    // Add sale/rent suffix
    const saleRentSuffix = isForRent ? 'de-inchiriat' : 'de-vanzare'
    propertyTypeSlug = `${propertyTypeSlug}-${saleRentSuffix}`
    
    // Build location slug (street-city or zone-city or just city)
    let locationSlug = ''
    const locationParts: string[] = []
    
    // Add street/address if available
    if (property.street) {
      locationParts.push(property.street.toLowerCase())
    } else if (property.address) {
      locationParts.push(property.address.toLowerCase())
    } else if (property.zone) {
      locationParts.push(property.zone.toLowerCase())
    }
    
    // Always add city if available
    if (property.city) {
      locationParts.push(property.city.toLowerCase())
    }
    
    // Create slug from location parts (replace spaces and special chars with hyphens)
    if (locationParts.length > 0) {
      locationSlug = locationParts
        .map(part => part.trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
        .filter(part => part.length > 0)
        .join('-')
    }
    
    // Build final URL: baseUrl + propertyTypeSlug + locationSlug + cp{id} + ?sid=tracking
    const propertyId = `cp${property.id}`
    const urlParts = [propertyTypeSlug]
    
    if (locationSlug) {
      urlParts.push(locationSlug)
    }
    
    urlParts.push(propertyId)
    
    const propertySlug = urlParts.join('-')
    // Generate a simple tracking ID (4 random alphanumeric chars)
    const trackingId = Math.random().toString(36).substring(2, 6).toUpperCase()
    
    return `${baseUrl}${propertySlug}/?sid=${trackingId}`
  }

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click when clicking WhatsApp button
    const title = getPropertyTitle()
    const price = formatPrice(property.price_sale, property.price_rent)
    const rooms = property.bedrooms || 0
    const baths = property.bathrooms || 0
    const surface = getSurface() || 'N/A'
    const location = getLocation()
    const propertyUrl = generatePropertyUrl()
    
    const message = `*${title}*\n\nPreț: ${price} | ${rooms} camere | ${baths} băi | Suprafață: ${surface}${location ? ` | ${location}` : ''}\n\nVezi detalii: ${propertyUrl}\n\nInteresat de această proprietate?`
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleCardClick = () => {
    const propertyUrl = generatePropertyUrl()
    console.log('🖱️ [PropertyCard] Opening property URL:', propertyUrl)
    window.open(propertyUrl, '_blank')
  }

  return (
    <Card 
      className="relative overflow-hidden border border-slate-700 bg-slate-800 hover:border-purple-500/50 transition-all duration-200 cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* Property Image - Clickable */}
      {firstImage && !imageError ? (
        <div className="relative w-full h-48 overflow-hidden bg-slate-700 group-hover:scale-105 transition-transform duration-200 cursor-pointer">
          <img
            src={firstImage}
            alt={getPropertyTitle()}
            className="w-full h-full object-cover"
            onError={() => {
              console.log('❌ [PropertyCard] Image failed to load:', firstImage)
              setImageError(true)
            }}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
          {imagesLoading && (
            <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            </div>
          )}
        </div>
      ) : imagesLoading ? (
        <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 cursor-pointer">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Se încarcă imaginea...</p>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 cursor-pointer">
          <div className="text-center">
            <ImageIcon className="h-12 w-12 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Fără imagine</p>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Title - Clickable */}
        <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 min-h-[3rem] group-hover:text-purple-300 transition-colors cursor-pointer">
          {getPropertyTitle()}
        </h3>

        {/* Price */}
        <div className="mb-4">
          <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-[#8870D0] to-blue-400">
            {formatPrice(property.price_sale, property.price_rent)}
          </p>
        </div>

        {/* Property Details - Icons */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Rooms */}
          {property.bedrooms !== undefined && property.bedrooms !== null && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/50">
              <Bed className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-semibold text-white">{property.bedrooms}</span>
            </div>
          )}

          {/* Bathrooms */}
          {property.bathrooms !== undefined && property.bathrooms !== null && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/50">
              <Bath className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-semibold text-white">{property.bathrooms}</span>
            </div>
          )}

          {/* Surface Area */}
          {getSurface() && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/50">
              <Square className="h-4 w-4 text-green-400" />
              <span className="text-xs font-semibold text-white">{getSurface()}</span>
            </div>
          )}
        </div>

        {/* WhatsApp Button - Separate click handler to prevent card click */}
        <button
          onClick={handleWhatsAppShare}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-sm transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          aria-label="Share on WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
          <span>Trimite pe WhatsApp</span>
        </button>
      </div>

      {/* Gradient accent bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600" />
    </Card>
  )
}

