/**
 * usePropertyImage Hook
 * 
 * DEPRECATED: Images are now included directly in property responses from OLD API.
 * This hook is kept for backwards compatibility but doesn't make separate API calls.
 * 
 * Per CRM Team Guidelines (Dec 2024):
 * - Images are included in /api/public/property/ response as `full_images` and `resized_images`
 * - NO separate /images/ endpoint calls needed
 * - This reduces API spam significantly
 */

import { useState, useEffect } from 'react';
import { loadPropertiesIndex } from '@/services/storage/propertiesCache';
import { createScopedLogger } from '@/lib/logger';
import type { PropertyImage } from './useProperties';

const logger = createScopedLogger('usePropertyImage');

export interface UsePropertyImageResult {
  images: PropertyImage[];
  primaryImageUrl: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Returns cached image for a property
 * 
 * NOTE: This no longer makes API calls - images come from the property response.
 * Only checks the local cache for previously stored images.
 */
export function usePropertyImage(
  propertyId: number,
  enabled: boolean = true
): UsePropertyImageResult {
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !propertyId) {
      return;
    }

    const loadFromCache = async () => {
      setIsLoading(true);
      
      try {
        // Only check cache - no API calls
        const cache = await loadPropertiesIndex();
        const cachedImage = cache?.primaryImagesByPropertyId[propertyId];
        
        if (cachedImage) {
          logger.log(`Using cached image for property ${propertyId}`);
          setPrimaryImageUrl(cachedImage.url);
          setImages([{
            id: 0,
            url: cachedImage.url,
            order: 0,
            is_sketch: cachedImage.is_sketch,
            width: cachedImage.width,
            height: cachedImage.height,
          }]);
        } else {
          // No cached image - property should have been fetched with images
          logger.log(`No cached image for property ${propertyId} - check property.resized_images`);
        }
      } catch (err) {
        logger.error(`Error loading cached image for property ${propertyId}:`, err);
        setError(err instanceof Error ? err : new Error('Failed to load cached image'));
      } finally {
        setIsLoading(false);
      }
    };

    loadFromCache();
  }, [propertyId, enabled]);

  return {
    images,
    primaryImageUrl,
    isLoading,
    error,
  };
}
