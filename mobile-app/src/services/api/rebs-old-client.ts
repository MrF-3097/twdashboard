/**
 * REBS OLD API Client
 * 
 * Per CRM Team Guidelines:
 * - Use OLD API for ALL GET operations (portfolio, agents, property images)
 * - OLD API endpoint: /api/public/property/ and /api/public/agent/
 * - Images are included directly in property response as `full_images` and `resized_images`
 * - NO SEPARATE IMAGE API CALLS NEEDED
 * 
 * Authentication (OLD API):
 * - Via query param: ?api_key=<token>
 * - Via header: Authorization: <token> (NO "Token " prefix!)
 * 
 * Pagination (OLD API):
 * - Uses `meta` field with: limit, next, offset, previous, total_count
 * - Uses `offset` and `limit` params
 * - Ordering via `order_by` param (e.g., order_by=-date_added)
 * 
 * Response Structure:
 * {
 *   "meta": { "limit": 20, "next": "...", "offset": 0, "previous": null, "total_count": 100 },
 *   "objects": [{ property1 }, { property2 }, ...]
 * }
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { createScopedLogger } from '@/lib/logger';

const logger = createScopedLogger('REBS OLD Client');

// REBS OLD API Base URL - root URL (meta.next returns full /api/public/property/ path)
const REBS_OLD_API_BASE = 'https://towerimob.crmrebs.com';

// OLD API Token - DIFFERENT from NEW API token!
// Auth: via ?api_key=<token> OR Authorization: <token> header (NO "Token " prefix)
const REBS_OLD_API_TOKEN = '303ea2a1928b789d9f4b011aecfe12199098b2fd';

/**
 * Creates REBS OLD API client for GET operations
 * 
 * Per CRM documentation:
 * - Auth via api_key query param OR Authorization header (NO "Token " prefix)
 * - Response has `meta` and `objects` fields
 */
export const createRebsOldClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: REBS_OLD_API_BASE,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // OLD API uses plain token in Authorization header (NO "Token " prefix!)
      // Per documentation: curl -H "Authorization: abcdef" http://towerimob.crmrebs.com/api/public/property/
      'Authorization': REBS_OLD_API_TOKEN,
    },
    // Add api_key as default query param (alternative auth method)
    // Per documentation: /api/public/property/?api_key=abcdef
    params: {
      api_key: REBS_OLD_API_TOKEN,
    },
  });

  // Request interceptor for logging
  client.interceptors.request.use(
    (config) => {
      if (__DEV__) {
        logger.log('Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params,
        });
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for logging
  client.interceptors.response.use(
    (response) => {
      logger.log('Response:', {
        url: response.config.url,
        status: response.status,
        totalCount: response.data?.meta?.total_count || 0,
        objectsCount: response.data?.objects?.length || 0,
        hasNext: !!response.data?.meta?.next,
      });
      return response;
    },
    async (error: AxiosError) => {
      const status = error.response?.status;
      const url = error.config?.url;
      
      logger.error('API Error:', {
        message: error.message,
        status,
        url,
        code: error.code,
      });
      
      return Promise.reject(error);
    }
  );

  return client;
};

// Export singleton instance for OLD API
export const rebsOldClient = createRebsOldClient();

/**
 * OLD API Response structure for properties
 */
export interface OldApiPropertyResponse {
  meta: {
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total_count: number;
  };
  objects: OldApiProperty[];
}

/**
 * Property from OLD API - includes images directly
 */
export interface OldApiProperty {
  id: number;
  title?: string;
  agent?: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    photo?: string;
  };
  availability: number; // 1 = Active, 4 = Sold by us, etc.
  city?: string;
  zone?: string;
  street?: string;
  region?: string;
  property_type: number;
  for_sale: boolean;
  for_rent: boolean;
  price_sale?: number;
  price_rent?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  surface_useable?: number;
  surface_built?: number;
  surface_land?: number;
  floor?: number;
  building_floors?: number;
  // Images are included directly - NO separate API call needed!
  full_images?: string[];
  resized_images?: string[];
  thumbnail?: string;
  // Other fields
  description?: string;
  date_added?: string;
  date_modified?: string;
  lat?: number;
  lng?: number;
  [key: string]: any;
}

/**
 * OLD API Response structure for agents
 */
export interface OldApiAgentResponse {
  meta: {
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total_count: number;
  };
  objects: OldApiAgent[];
}

/**
 * Agent from OLD API
 */
export interface OldApiAgent {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  photo?: string;
  [key: string]: any;
}

