/**
 * Secure Storage Service
 * Provides encrypted storage for sensitive data using Expo SecureStore
 * 
 * @module secureStorage
 */

import * as SecureStore from 'expo-secure-store';
import { createScopedLogger } from '@/lib/logger';

const logger = createScopedLogger('SecureStorage');

// Storage keys
const AUTH_DATA_KEY = 'towerimob_auth_data';
const REBS_TOKEN_KEY = 'towerimob_rebs_token';

/**
 * Stores authentication data securely
 * 
 * @param authData - Authentication data object to store
 * @returns Promise that resolves when data is stored
 */
export const storeAuthData = async (authData: any): Promise<void> => {
  try {
    const dataToStore = JSON.stringify({
      agentData: authData,
      timestamp: Date.now(),
    });
    await SecureStore.setItemAsync(AUTH_DATA_KEY, dataToStore);
    logger.log('Auth data stored securely');
  } catch (error) {
    logger.error('Error storing auth data:', error);
    throw error;
  }
};

/**
 * Retrieves authentication data from secure storage
 * 
 * @returns Promise that resolves with auth data or null if not found
 */
export const getAuthData = async (): Promise<{ agentData: any; timestamp: number } | null> => {
  try {
    const storedData = await SecureStore.getItemAsync(AUTH_DATA_KEY);
    if (!storedData) {
      return null;
    }
    const parsed = JSON.parse(storedData);
    logger.log('Auth data retrieved from secure storage');
    return parsed;
  } catch (error) {
    logger.error('Error retrieving auth data:', error);
    return null;
  }
};

/**
 * Removes authentication data from secure storage
 */
export const removeAuthData = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(AUTH_DATA_KEY);
    logger.log('Auth data removed from secure storage');
  } catch (error) {
    logger.error('Error removing auth data:', error);
  }
};

/**
 * Stores REBS API token securely
 * 
 * @param token - REBS API token to store
 */
export const storeRebsToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(REBS_TOKEN_KEY, token);
    logger.log('REBS token stored securely');
  } catch (error) {
    logger.error('Error storing REBS token:', error);
    throw error;
  }
};

/**
 * Retrieves REBS API token from secure storage
 * 
 * @returns Promise that resolves with token or null if not found
 */
export const getRebsToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync(REBS_TOKEN_KEY);
    return token;
  } catch (error) {
    logger.error('Error retrieving REBS token:', error);
    return null;
  }
};

/**
 * Removes REBS API token from secure storage
 */
export const removeRebsToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(REBS_TOKEN_KEY);
    logger.log('REBS token removed from secure storage');
  } catch (error) {
    logger.error('Error removing REBS token:', error);
  }
};









