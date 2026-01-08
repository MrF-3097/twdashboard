/**
 * REBS NEW API Client
 * 
 * IMPORTANT: Per CRM Team Guidelines (Dec 2024)
 * - Use NEW API ONLY for POST operations:
 *   - POST /api/public/addproperty/ - Add new property
 *   - POST /api/public/addrequest/ - Add new request
 *   - GET cereri (requests) if fetching from REBS
 * 
 * - DO NOT use NEW API for:
 *   - Portfolio listings (use OLD API)
 *   - Property images (included in OLD API response)
 *   - Agent data (use OLD API)
 * 
 * See rebs-old-client.ts for GET operations
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { createScopedLogger } from '@/lib/logger';

const logger = createScopedLogger('REBS NEW Client');

// REBS NEW API Base URL - for POST operations
const REBS_NEW_API_BASE = 'https://towerimob.crmrebs.com/api';

// API Token
const REBS_API_TOKEN = '22a329334f5a2cfae340a427eff3d7d07847d5a7';

/**
 * Creates REBS NEW API client for POST operations only
 * 
 * Use this ONLY for:
 * - POST /public/addproperty/
 * - POST /public/addrequest/
 */
export const createRebsClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: REBS_NEW_API_BASE,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // Token authentication for NEW API
      'Authorization': `Token ${REBS_API_TOKEN}`,
    },
    params: {
      api_key: REBS_API_TOKEN,
    },
  });

  // Request interceptor for logging
  client.interceptors.request.use(
    (config) => {
      if (__DEV__) {
        logger.log('NEW API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
        });
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      logger.log('NEW API Response:', {
        url: response.config.url,
        status: response.status,
        success: response.data?.success,
      });
      return response;
    },
    async (error: AxiosError) => {
      const status = error.response?.status;
      const url = error.config?.url;
      
      logger.error('NEW API Error:', {
        message: error.message,
        status,
        url,
      });
      
      return Promise.reject(error);
    }
  );

  return client;
};

// Export singleton instance
export const rebsClient = createRebsClient();
