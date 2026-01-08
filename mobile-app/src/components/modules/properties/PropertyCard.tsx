/**
 * Property Card Component
 * EXACT copy of webapp - matching every div, className, spacing, and structure
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Image } from 'expo-image';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';

export interface Property {
  id: number;
  title?: string;
  name?: string;
  address?: string;
  zone?: string;
  city?: string;
  street?: string;
  price_sale?: number | null;
  price_rent?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  surface_useable?: number | null;
  property_type?: number;
  for_sale?: boolean;
  for_rent?: boolean;
  resized_images?: string[];
  full_images?: string[];
  thumbnail?: string;
  agent?: { id: number } | number;
  [key: string]: any;
}

interface PropertyCardProps {
  property: Property;
  onPress?: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress }) => {
  const [imageError, setImageError] = useState(false);

  const formatPrice = (salePrice?: number | null, rentPrice?: number | null) => {
    if (salePrice && salePrice > 0) {
      return new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(salePrice);
    }
    if (rentPrice && rentPrice > 0) {
      return `${new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(rentPrice)}/lună`;
    }
    return 'Preț pe cerere';
  };

  const formatSurface = (surface?: number | null) => {
    if (!surface || surface === 0) return null;
    return `${Math.round(surface)} m²`;
  };

  const getSurface = () => {
    if (property.surface_useable && property.surface_useable > 0) {
      return formatSurface(property.surface_useable);
    }
    return null;
  };

  const getPropertyTitle = () => {
    if (property.title) return property.title;
    if (property.name) return property.name;
    if (property.address) return property.address;
    return `Proprietate #${property.id}`;
  };

  const getLocation = () => {
    const parts = [];
    if (property.address) parts.push(property.address);
    if (property.zone) parts.push(property.zone);
    if (property.city) parts.push(property.city);
    return parts.join(', ') || '';
  };

  const generatePropertyUrl = (): string => {
    const baseUrl = 'https://www.towerimob.ro/';
    const propertyTypeMap: Record<number, string> = {
      1: 'apartament',
      3: 'casa-vila',
      6: 'teren',
      4: 'spatiu-de-birouri',
      5: 'spatiu-comercial',
    };
    const isForRent = property.for_rent || (!property.for_sale && property.price_rent);
    const propertyTypeId = property.property_type as number;
    let propertyTypeSlug = 'proprietate';
    if (propertyTypeId && propertyTypeMap[propertyTypeId]) {
      propertyTypeSlug = propertyTypeMap[propertyTypeId];
    }
    const saleRentSuffix = isForRent ? 'de-inchiriat' : 'de-vanzare';
    propertyTypeSlug = `${propertyTypeSlug}-${saleRentSuffix}`;
    let locationSlug = '';
    const locationParts: string[] = [];
    if (property.street) {
      locationParts.push(property.street.toLowerCase());
    } else if (property.address) {
      locationParts.push(property.address.toLowerCase());
    } else if (property.zone) {
      locationParts.push(property.zone.toLowerCase());
    }
    if (property.city) {
      locationParts.push(property.city.toLowerCase());
    }
    if (locationParts.length > 0) {
      locationSlug = locationParts
        .map(part => part.trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
        .filter(part => part.length > 0)
        .join('-');
    }
    const propertyId = `cp${property.id}`;
    const urlParts = [propertyTypeSlug];
    if (locationSlug) {
      urlParts.push(locationSlug);
    }
    urlParts.push(propertyId);
    const propertySlug = urlParts.join('-');
    const trackingId = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${baseUrl}${propertySlug}/?sid=${trackingId}`;
  };

  const handleWhatsAppShare = () => {
    const title = getPropertyTitle();
    const price = formatPrice(property.price_sale, property.price_rent);
    const rooms = property.bedrooms || 0;
    const baths = property.bathrooms || 0;
    const surface = getSurface() || 'N/A';
    const location = getLocation();
    const propertyUrl = generatePropertyUrl();
    const message = `*${title}*\n\nPreț: ${price} | ${rooms} camere | ${baths} băi | Suprafață: ${surface}${location ? ` | ${location}` : ''}\n\nVezi detalii: ${propertyUrl}\n\nInteresat de această proprietate?`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl);
  };

  const handleCardClick = () => {
    const propertyUrl = generatePropertyUrl();
    Linking.openURL(propertyUrl);
    if (onPress) onPress();
  };

  // Get first image - property should already have normalized URLs from useProperties hook
  // But we'll add extra safety checks here
  const getFirstImage = () => {
    // Helper to ensure URL is valid and absolute
    const ensureAbsoluteUrl = (url: string | null | undefined): string | null => {
      if (!url || typeof url !== 'string') return null;
      const trimmed = url.trim();
      if (!trimmed) return null;
      // If already absolute URL, return as-is
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }
      // If relative URL, make it absolute (REBS API base)
      if (trimmed.startsWith('/')) {
        return `https://towerimob.crmrebs.com${trimmed}`;
      }
      // If it looks like a URL without protocol, add https
      if (trimmed.includes('.') && !trimmed.includes(' ')) {
        return `https://${trimmed}`;
      }
      return null;
    };

    // Check resized_images (array of URLs) - preferred for performance
    // These should already be normalized strings from useProperties hook
    if (property.resized_images && Array.isArray(property.resized_images)) {
      for (const img of property.resized_images) {
        const url = typeof img === 'string' ? ensureAbsoluteUrl(img) : null;
        if (url) return url;
      }
    }
    
    // Check full_images (array of URLs) - fallback
    if (property.full_images && Array.isArray(property.full_images)) {
      for (const img of property.full_images) {
        const url = typeof img === 'string' ? ensureAbsoluteUrl(img) : null;
        if (url) return url;
      }
    }
    
    // Check thumbnail (single URL) - quick fallback
    if (property.thumbnail) {
      const url = typeof property.thumbnail === 'string' 
        ? ensureAbsoluteUrl(property.thumbnail)
        : null;
      if (url) return url;
    }
    
    // Check for images array (alternative format)
    if (property.images && Array.isArray(property.images)) {
      for (const img of property.images) {
        const url = typeof img === 'string' ? ensureAbsoluteUrl(img) : null;
        if (url) return url;
      }
    }
    
    return null;
  };

  const firstImage = getFirstImage();

  return (
    // relative overflow-hidden border border-slate-700 bg-slate-800
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardClick}
      activeOpacity={0.8}
    >
      {/* Property Image - relative w-full h-48 overflow-hidden bg-slate-700 */}
      {firstImage && !imageError ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: firstImage }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            onError={() => setImageError(true)}
            accessibilityLabel={`Imagine proprietate ${getPropertyTitle()}`}
          />
          {/* absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent */}
          <SafeLinearGradient
            colors={['rgba(15, 23, 42, 0.8)', 'transparent', 'transparent']}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={styles.imageOverlay}
          />
        </View>
      ) : (
        // relative w-full h-48 overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center
        <View style={styles.imagePlaceholder}>
          <View style={styles.placeholderContent}>
            <Ionicons name="image-outline" size={48} color="#64748B" />
            {/* text-xs text-slate-400 */}
            <Text style={styles.placeholderText}>Fără imagine</Text>
          </View>
        </View>
      )}

      {/* p-4 */}
      <View style={styles.content}>
        {/* Title - text-lg font-bold text-white mb-3 line-clamp-2 min-h-[3rem] */}
        <Text style={styles.title} numberOfLines={2}>
          {getPropertyTitle()}
        </Text>

        {/* Price - mb-4 */}
        <View style={styles.priceContainer}>
          {/* text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-[#8870D0] to-blue-400 */}
          <SafeLinearGradient
            colors={['#A78BFA', '#8870D0', '#60A5FA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.priceGradient}
          >
            <Text style={styles.price}>{formatPrice(property.price_sale, property.price_rent)}</Text>
          </SafeLinearGradient>
        </View>

        {/* Property Details - flex flex-wrap gap-3 mb-4 */}
        <View style={styles.detailsRow}>
          {/* Rooms - flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/50 */}
          {property.bedrooms !== undefined && property.bedrooms !== null && (
            <View style={styles.detailBadge}>
              <Ionicons name="bed-outline" size={16} color="#60A5FA" />
              {/* text-xs font-semibold text-white */}
              <Text style={styles.detailText}>{property.bedrooms}</Text>
            </View>
          )}

          {/* Bathrooms */}
          {property.bathrooms !== undefined && property.bathrooms !== null && (
            <View style={styles.detailBadge}>
              <Ionicons name="water-outline" size={16} color="#A78BFA" />
              <Text style={styles.detailText}>{property.bathrooms}</Text>
            </View>
          )}

          {/* Surface Area */}
          {getSurface() && (
            <View style={styles.detailBadge}>
              <Ionicons name="square-outline" size={16} color="#34D399" />
              <Text style={styles.detailText}>{getSurface()}</Text>
            </View>
          )}
        </View>

        {/* WhatsApp Button - w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 */}
        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={handleWhatsAppShare}
          activeOpacity={0.8}
        >
          <SafeLinearGradient
            colors={['#22C55E', '#16A34A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.whatsappGradient}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />
            {/* text-white font-semibold text-sm */}
            <Text style={styles.whatsappText}>Trimite pe WhatsApp</Text>
          </SafeLinearGradient>
        </TouchableOpacity>
      </View>

      {/* Gradient accent bar - absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 */}
      <SafeLinearGradient
        colors={['#9333EA', '#2563EB', '#9333EA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentBar}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // relative overflow-hidden border border-slate-700 bg-slate-800
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155', // border-slate-700
    backgroundColor: '#1E293B', // bg-slate-800
    borderRadius: 12,
    marginBottom: 16,
  },
  // relative w-full h-48 overflow-hidden bg-slate-700
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 192, // h-48
    overflow: 'hidden',
    backgroundColor: '#334155', // bg-slate-700
  },
  image: {
    width: '100%',
    height: '100%',
  },
  // absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // relative w-full h-48 overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center
  imagePlaceholder: {
    position: 'relative',
    width: '100%',
    height: 192, // h-48
    overflow: 'hidden',
    backgroundColor: '#334155', // Simplified gradient
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContent: {
    alignItems: 'center',
  },
  // text-xs text-slate-400
  placeholderText: {
    fontSize: 12, // text-xs
    color: '#94A3B8', // text-slate-400
    marginTop: 8,
  },
  // p-4
  content: {
    padding: 16, // p-4
  },
  // text-lg font-bold text-white mb-3 line-clamp-2 min-h-[3rem]
  title: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: '#FFFFFF',
    marginBottom: 12, // mb-3
    minHeight: 48, // min-h-[3rem]
  },
  // mb-4
  priceContainer: {
    marginBottom: 16, // mb-4
  },
  priceGradient: {
    // Gradient text effect - using gradient background
  },
  // text-2xl font-black
  price: {
    fontSize: 24, // text-2xl
    fontWeight: '900', // font-black
    color: '#FFFFFF', // Will be overlaid on gradient
  },
  // flex flex-wrap gap-3 mb-4
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12, // gap-3
    marginBottom: 16, // mb-4
  },
  // flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/50
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // gap-1.5
    paddingHorizontal: 10, // px-2.5
    paddingVertical: 6, // py-1.5
    borderRadius: 8, // rounded-lg
    backgroundColor: 'rgba(51, 65, 85, 0.5)', // bg-slate-700/50
  },
  // text-xs font-semibold text-white
  detailText: {
    fontSize: 12, // text-xs
    fontWeight: '600', // font-semibold
    color: '#FFFFFF',
  },
  // w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600
  whatsappButton: {
    width: '100%',
    borderRadius: 12, // rounded-xl
    overflow: 'hidden',
  },
  whatsappGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8, // gap-2
    paddingHorizontal: 16, // px-4
    paddingVertical: 12, // py-3
  },
  // text-white font-semibold text-sm
  whatsappText: {
    color: '#FFFFFF',
    fontWeight: '600', // font-semibold
    fontSize: 14, // text-sm
  },
  // absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600
  accentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4, // h-1
  },
});
