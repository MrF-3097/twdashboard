/**
 * useProperties Hook
 * 
 * IMPORTANT: Per CRM Team Guidelines (Dec 2024)
 * - Uses OLD API /api/public/property/ for ALL property GET operations
 * - Images are included directly in response (full_images, resized_images)
 * - NO SEPARATE IMAGE API CALLS - reduces API spam significantly
 * - 6-hour cache TTL to prevent unnecessary refetches
 * 
 * OLD API Specifics:
 * - Endpoint: /api/public/property/
 * - Pagination: Uses `meta.next` and `offset/limit` params
 * - Ordering: Uses `order_by` param (e.g., -date_added)
 * - Auth: api_key query param OR Authorization header (no "Token " prefix)
 * - Response: { meta: {...}, objects: [...] }
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { rebsOldClient, type OldApiProperty, type OldApiPropertyResponse } from '@/services/api/rebs-old-client';
import { createScopedLogger } from '@/lib/logger';
import { useAppState, useNetworkStatus } from './useNetworkStatus';
import {
  loadPropertiesIndex,
  savePropertiesIndex,
  extractMinimalProperty,
  type MinimalProperty,
  type ImageMetadata,
} from '@/services/storage/propertiesCache';

const logger = createScopedLogger('useProperties');

// 6-hour cache TTL - CRM team requested to reduce API calls
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Property interface for the app
 * Mapped from OLD API response
 */
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
  rooms?: number | null;
  surface_useable?: number | null;
  property_type?: number;
  for_sale?: boolean;
  for_rent?: boolean;
  availability?: number | boolean | string;
  active?: boolean;
  // Images from OLD API - included directly, NO separate fetch needed!
  resized_images?: string[];
  full_images?: string[];
  thumbnail?: string;
  primaryImageUrl?: string;
  agent?: OldApiProperty['agent'];
  [key: string]: any;
}

/**
 * PropertyImage interface (for compatibility)
 */
export interface PropertyImage {
  id: number;
  url: string;
  order: number;
  is_sketch: boolean;
  width?: number;
  height?: number;
}

/**
 * Properties response wrapper
 */
export interface PropertiesResponse {
  success: boolean;
  data: {
    objects: Property[];
    meta: {
      total_count: number;
      limit: number;
      offset: number;
    };
  };
}

/**
 * Normalizes image URL to ensure it's absolute
 */
function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return `https://towerimob.crmrebs.com${trimmed}`;
  }
  return trimmed;
}

/**
 * Maps OLD API property to app Property format
 * Images are already included - no separate fetch needed!
 */
function mapOldApiProperty(apiProperty: OldApiProperty): Property {
  // Normalize image URLs
  const resizedImages = (apiProperty.resized_images || [])
    .map(normalizeImageUrl)
    .filter((url): url is string => url !== null);
  
  const fullImages = (apiProperty.full_images || [])
    .map(normalizeImageUrl)
    .filter((url): url is string => url !== null);
  
  // Combine unique images
  const allImages = Array.from(new Set([...resizedImages, ...fullImages]));
  
  // Set primary image
  const thumbnail = normalizeImageUrl(apiProperty.thumbnail);
  const primaryImage = thumbnail || allImages[0] || null;

  return {
    id: apiProperty.id,
    title: apiProperty.title,
    zone: apiProperty.zone,
    city: apiProperty.city,
    street: apiProperty.street,
    address: apiProperty.street || apiProperty.zone,
    price_sale: apiProperty.price_sale || null,
    price_rent: apiProperty.price_rent || null,
    bedrooms: apiProperty.bedrooms || null,
    bathrooms: apiProperty.bathrooms || null,
    rooms: apiProperty.rooms || null,
    surface_useable: apiProperty.surface_useable || null,
    property_type: apiProperty.property_type,
    for_sale: apiProperty.for_sale,
    for_rent: apiProperty.for_rent,
    availability: apiProperty.availability,
    active: apiProperty.availability === 1,
    // Images directly from OLD API - NO SEPARATE FETCH!
    resized_images: allImages,
    full_images: allImages,
    thumbnail: primaryImage || undefined,
    primaryImageUrl: primaryImage || undefined,
    agent: apiProperty.agent,
  };
}

/**
 * Fetches ALL properties from OLD API with pagination
 * 
 * Per CRM documentation:
 * - Endpoint: /api/public/property/
 * - Pagination: Follow `meta.next` until null
 * - Ordering: `order_by=-date_added` for newest first
 * - Images included in response as `full_images` and `resized_images`
 * 
 * Error handling:
 * - If a page fails, returns already-fetched data (partial success)
 * - Retries failed pages up to 3 times with 5s delay (per CRM docs)
 */
async function fetchAllPropertiesFromOldApi(): Promise<PropertiesResponse> {
  const allProperties: Property[] = [];
  // Start with full path - baseURL is now just https://towerimob.crmrebs.com
  let nextUrl: string | null = '/api/public/property/';
  let pageCount = 0;
  const maxPages = 100; // Safety limit
  const maxRetries = 3; // Per CRM docs: retry at least 3 times

  logger.log('Fetching properties from OLD API /api/public/property/ (images included in response)');

  while (nextUrl && pageCount < maxPages) {
    pageCount++;
    let retryCount = 0;
    let pageSuccess = false;
    
    while (!pageSuccess && retryCount < maxRetries) {
      try {
        // For first request, add ordering. For subsequent, use meta.next URL directly
        const isFirstPage = pageCount === 1;
        const currentRequestUrl: string = isFirstPage ? '/api/public/property/' : nextUrl;
        // Only add params on first page - subsequent pages use URL from meta.next
        // Try to expand agent field if API supports it (some REST APIs support ?expand=agent or ?fields=agent)
        const params: Record<string, any> = isFirstPage 
          ? { 
              order_by: '-date_added', 
              limit: 50,
              // Try to expand/include agent data - different APIs use different param names
              expand: 'agent', // Some APIs use 'expand'
              fields: 'agent', // Some APIs use 'fields'
              include: 'agent', // Some APIs use 'include'
            } 
          : {};
        
        if (retryCount > 0) {
          logger.log(`Retrying page ${pageCount} (attempt ${retryCount + 1}/${maxRetries})`);
        } else {
          logger.log(`Fetching page ${pageCount}: ${currentRequestUrl}`);
        }
        
        const response = await rebsOldClient.get<OldApiPropertyResponse>(currentRequestUrl, { params });
        const responseData = response.data;
        
        // Log agent field structure for first property to debug
        if (pageCount === 1 && responseData.objects && responseData.objects.length > 0) {
          const firstProperty = responseData.objects[0];
          logger.log('Sample property agent field from API:', {
            propertyId: firstProperty.id,
            agent: firstProperty.agent,
            agentType: typeof firstProperty.agent,
            agentStringified: typeof firstProperty.agent === 'object' 
              ? JSON.stringify(firstProperty.agent).substring(0, 200) 
              : String(firstProperty.agent),
            hasAgentId: !!(firstProperty as any).agent_id,
            agentIdField: (firstProperty as any).agent_id,
          });
        }
        
        // Filter active properties and map to app format
        const activeProperties = (responseData.objects || [])
          .filter((p: OldApiProperty) => p.availability === 1) // Only active properties
          .map(mapOldApiProperty);
        
        allProperties.push(...activeProperties);
        
        logger.log(`Page ${pageCount}: ${responseData.objects.length} total, ${activeProperties.length} active, running total: ${allProperties.length}`);
        
        // Get next page URL from meta
        // Per OLD API docs: meta.next returns relative URL like "/api/public/property/?offset=20&limit=20"
        if (responseData.meta?.next) {
          // Use meta.next directly - it's a relative URL that we use as-is
          // Example: "/api/public/property/?offset=50&limit=50"
          nextUrl = responseData.meta.next;
          logger.log(`Next page URL from meta.next: ${nextUrl}`);
        } else {
          nextUrl = null;
          logger.log('No more pages (meta.next is null)');
        }
        
        pageSuccess = true;
        
        // Small delay between pages to be nice to the server
        if (nextUrl) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        retryCount++;
        logger.warn(`Error fetching page ${pageCount} (attempt ${retryCount}/${maxRetries}):`, error);
        
        if (retryCount < maxRetries) {
          // Wait 5 seconds before retry (per CRM docs: retry after 5 minutes, but we use 5s for mobile)
          logger.log(`Waiting 5s before retry...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          // All retries failed - return what we have so far
          logger.error(`Page ${pageCount} failed after ${maxRetries} attempts. Returning ${allProperties.length} properties fetched so far.`);
          
          // If we have some data, return it (partial success)
          if (allProperties.length > 0) {
            return {
              success: true, // Partial success
              data: {
                objects: allProperties,
                meta: {
                  total_count: allProperties.length,
                  limit: 50,
                  offset: 0,
                },
              },
            };
          }
          
          // No data at all - throw error
          throw error;
        }
      }
    }
  }

  if (pageCount >= maxPages) {
    logger.warn(`Reached max pages limit (${maxPages})`);
  }

  logger.log(`✅ COMPLETE: Fetched ${allProperties.length} active properties from ${pageCount} pages (images included)`);

  return {
    success: true,
    data: {
      objects: allProperties,
      meta: {
        total_count: allProperties.length,
        limit: 50,
        offset: 0,
      },
    },
  };
}

/**
 * Hydrates properties from cache
 */
function hydratePropertiesFromCache(
  cachedProperties: MinimalProperty[],
  primaryImages: Record<string | number, ImageMetadata>
): Property[] {
  return cachedProperties.map((minimal) => {
    const primaryImage = primaryImages[minimal.id];
    const imageUrl = primaryImage?.url || minimal.primaryImageUrl || null;
    
    return {
      ...minimal,
      id: minimal.id as number,
      resized_images: imageUrl ? [imageUrl] : [],
      full_images: imageUrl ? [imageUrl] : [],
      thumbnail: imageUrl || undefined,
      primaryImageUrl: imageUrl || undefined,
    } as Property;
  });
}

/**
 * Force refresh flag - when set, bypasses cache on next fetch
 */
let forceRefreshFlag = false;

/**
 * Call this to force a cache bypass on next properties fetch
 */
export function invalidatePropertiesCache() {
  forceRefreshFlag = true;
  logger.log('Properties cache invalidated - will bypass cache on next fetch');
}

export function useProperties() {
  const [cachedData, setCachedData] = useState<PropertiesResponse | undefined>(undefined);
  const appState = useAppState();
  const { isConnected } = useNetworkStatus();
  
  // REDUCED POLLING: 5min foreground, 15min background (CRM team requested to reduce API calls)
  const pollInterval = React.useMemo(() => {
    if (!isConnected) {
      return false; // Pause polling when offline
    }
    // Much longer intervals to reduce API spam
    return appState === 'active' ? 5 * 60 * 1000 : 15 * 60 * 1000; // 5min / 15min
  }, [appState, isConnected]);

  // Load cache on mount
  useEffect(() => {
    const loadCache = async () => {
      const cache = await loadPropertiesIndex();
      if (cache) {
        logger.log(`✅ Using cached properties (${cache.properties.length} properties, age: ${Math.round((Date.now() - cache.lastSyncedAt) / 60000)}min)`);
        const hydrated = hydratePropertiesFromCache(
          cache.properties,
          cache.primaryImagesByPropertyId
        );
        
        setCachedData({
          success: true,
          data: {
            objects: hydrated,
            meta: {
              total_count: hydrated.length,
              limit: 50,
              offset: 0,
            },
          },
        });
      }
    };
    
    loadCache();
  }, []);

  const query = useQuery<PropertiesResponse>({
    queryKey: ['rebsProperties'],
    queryFn: async () => {
      // Check if force refresh was requested
      const shouldForceRefresh = forceRefreshFlag;
      if (shouldForceRefresh) {
        forceRefreshFlag = false; // Reset flag
        logger.log('Force refresh requested - bypassing cache');
      }
      
      // Check cache first - 6 hour TTL (unless force refresh)
      if (!shouldForceRefresh) {
        const cache = await loadPropertiesIndex();
        if (cache) {
          const age = Date.now() - cache.lastSyncedAt;
          if (age < CACHE_TTL_MS) {
            logger.log(`✅ Cache is fresh (${Math.round(age / 60000)}min old), skipping API call`);
            const hydrated = hydratePropertiesFromCache(
              cache.properties,
              cache.primaryImagesByPropertyId
            );
            return {
              success: true,
              data: {
                objects: hydrated,
                meta: {
                  total_count: hydrated.length,
                  limit: 50,
                  offset: 0,
                },
              },
            };
          }
          logger.log(`Cache expired (${Math.round(age / 60000)}min old), fetching fresh data`);
        }
      }

      // Fetch from OLD API
      logger.log('Fetching fresh data from OLD API...');
      const freshData = await fetchAllPropertiesFromOldApi();
      
      // Save to cache
      const minimalProperties = freshData.data.objects.map(extractMinimalProperty);
      const primaryImages: Record<string | number, ImageMetadata> = {};
      
      // Extract primary images from properties (already in response!)
      freshData.data.objects.forEach(property => {
        const imageUrl = property.primaryImageUrl || property.thumbnail || property.resized_images?.[0];
        if (imageUrl) {
          primaryImages[property.id] = {
            url: imageUrl,
            is_sketch: false,
            cachedAt: Date.now(),
          };
        }
      });
      
      await savePropertiesIndex(minimalProperties, primaryImages);
      logger.log('✅ Cache saved successfully');
      
      return freshData;
    },
    staleTime: CACHE_TTL_MS, // 6 hours
    gcTime: 30 * 60 * 1000, // 30 minutes
    placeholderData: cachedData,
    refetchOnMount: false, // Don't refetch if cache is fresh
    refetchOnWindowFocus: false,
    refetchInterval: pollInterval,
    refetchIntervalInBackground: false, // Don't poll in background
    refetchOnError: false,
    enabled: isConnected,
  });

  return query;
}

// Export fetchPropertyImages as no-op for backwards compatibility
// Images are now included in property response, no separate fetch needed
export async function fetchPropertyImages(propertyId: number): Promise<PropertyImage[]> {
  logger.warn(`fetchPropertyImages called for ${propertyId} - images should be in property response, not fetched separately`);
  return [];
}
