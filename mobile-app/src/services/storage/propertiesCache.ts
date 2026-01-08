/**
 * Properties Index Cache
 * 
 * Persists minimal property data to AsyncStorage to prevent refetches on Expo Go restarts.
 * Only stores essential fields for list/grid rendering and ONE primary image per property.
 * 
 * Storage Schema:
 * {
 *   lastSyncedAt: number (timestamp),
 *   ttlMs: number (21600000 = 6 hours),
 *   properties: Array<MinimalProperty>,
 *   primaryImagesByPropertyId: { [propertyId]: ImageMetadata }
 * }
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createScopedLogger } from '@/lib/logger';

const logger = createScopedLogger('PropertiesCache');

const STORAGE_KEY = 'properties_index_v1';
const DEFAULT_TTL_MS = 21600000; // 6 hours

/**
 * Minimal property fields needed for list/grid rendering
 */
export interface MinimalProperty {
  id: number | string;
  price_sale?: number | null;
  price_rent?: number | null;
  rooms?: number | null;
  surface_useable?: number | null;
  city_id?: number | null;
  primaryImageUrl?: string | null;
  // Add any other minimal fields needed for list rendering
  title?: string;
  name?: string;
  address?: string;
  zone?: string;
  city?: string;
  property_type?: number;
  for_sale?: boolean;
  for_rent?: boolean;
  bedrooms?: number | null;
  bathrooms?: number | null;
}

/**
 * Primary image metadata
 */
export interface ImageMetadata {
  url: string;
  width?: number;
  height?: number;
  is_sketch: boolean;
  cachedAt: number; // timestamp
}

/**
 * Properties index cache structure
 */
export interface PropertiesIndexCache {
  lastSyncedAt: number;
  ttlMs: number;
  properties: MinimalProperty[];
  primaryImagesByPropertyId: Record<string | number, ImageMetadata>;
}

/**
 * Loads properties index from AsyncStorage
 * Returns null if cache doesn't exist or is expired
 */
export async function loadPropertiesIndex(): Promise<PropertiesIndexCache | null> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (!cached) {
      logger.log('No cached properties index found');
      return null;
    }

    const data: PropertiesIndexCache = JSON.parse(cached);
    const age = Date.now() - data.lastSyncedAt;
    const ttlMs = data.ttlMs || DEFAULT_TTL_MS;

    logger.log(`Cache age: ${Math.round(age / 1000)}s, TTL: ${Math.round(ttlMs / 1000)}s`);

    if (age >= ttlMs) {
      logger.log('Cache expired, will refetch');
      return null;
    }

    logger.log(`✅ Cache valid: ${data.properties.length} properties, ${Object.keys(data.primaryImagesByPropertyId).length} images`);
    return data;
  } catch (error) {
    logger.error('Error loading properties index:', error);
    return null;
  }
}

/**
 * Clears the properties cache - forces fresh API fetch on next load
 */
export async function clearPropertiesCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    logger.log('✅ Properties cache cleared - will fetch fresh data on next load');
  } catch (error) {
    logger.error('Error clearing properties cache:', error);
  }
}

/**
 * Saves properties index to AsyncStorage
 */
export async function savePropertiesIndex(
  properties: MinimalProperty[],
  primaryImages?: Record<string | number, ImageMetadata>
): Promise<void> {
  try {
    const cache: PropertiesIndexCache = {
      lastSyncedAt: Date.now(),
      ttlMs: DEFAULT_TTL_MS,
      properties,
      primaryImagesByPropertyId: primaryImages || {},
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    logger.log(`✅ Saved ${properties.length} properties to cache`);
  } catch (error) {
    logger.error('Error saving properties index:', error);
    throw error;
  }
}

/**
 * Updates a single property's primary image in cache
 */
export async function updatePropertyPrimaryImage(
  propertyId: number | string,
  imageMetadata: ImageMetadata
): Promise<void> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (!cached) {
      logger.warn('Cannot update image: no cache found');
      return;
    }

    const data: PropertiesIndexCache = JSON.parse(cached);
    data.primaryImagesByPropertyId[propertyId] = imageMetadata;

    // Update primaryImageUrl in property if it exists
    const property = data.properties.find(p => p.id === propertyId);
    if (property) {
      property.primaryImageUrl = imageMetadata.url;
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    logger.log(`✅ Updated primary image for property ${propertyId}`);
  } catch (error) {
    logger.error(`Error updating primary image for property ${propertyId}:`, error);
  }
}

/**
 * Extracts minimal property fields from full property object
 */
export function extractMinimalProperty(property: any): MinimalProperty {
  return {
    id: property.id,
    price_sale: property.price_sale,
    price_rent: property.price_rent,
    rooms: property.rooms,
    surface_useable: property.surface_useable,
    city_id: property.city_id,
    title: property.title,
    name: property.name,
    address: property.address,
    zone: property.zone,
    city: property.city,
    property_type: property.property_type,
    for_sale: property.for_sale,
    for_rent: property.for_rent,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    primaryImageUrl: property.primaryImageUrl || null,
  };
}

/**
 * Selects primary image from images array
 * Returns the first non-sketch image with lowest order, or first image if all are sketches
 */
export function selectPrimaryImage(images: Array<{ url: string; order?: number; is_sketch?: boolean; width?: number; height?: number }>): ImageMetadata | null {
  if (!images || images.length === 0) {
    return null;
  }

  // Sort by order (lowest first), then filter out sketches
  const sorted = [...images].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Find first non-sketch image
  const primary = sorted.find(img => !img.is_sketch) || sorted[0];

  return {
    url: primary.url,
    width: primary.width,
    height: primary.height,
    is_sketch: primary.is_sketch || false,
    cachedAt: Date.now(),
  };
}

