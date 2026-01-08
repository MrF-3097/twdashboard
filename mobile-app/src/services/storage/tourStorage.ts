/**
 * Tour Storage
 * 
 * Persists the onboarding tour state using AsyncStorage.
 * The `hasSeenTour` flag is set to true when the tour is completed, skipped, or dismissed.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createScopedLogger } from '@/lib/logger';

const logger = createScopedLogger('TourStorage');

const TOUR_SEEN_KEY = 'hasSeenTour';

/**
 * Check if the user has already seen the onboarding tour
 */
export const getHasSeenTour = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(TOUR_SEEN_KEY);
    const hasSeen = value === 'true';
    logger.log('Tour seen status:', hasSeen);
    return hasSeen;
  } catch (error) {
    logger.error('Error reading tour status:', error);
    return false;
  }
};

/**
 * Mark the tour as seen (called on complete, skip, or dismiss)
 */
export const setHasSeenTour = async (seen: boolean = true): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOUR_SEEN_KEY, seen ? 'true' : 'false');
    logger.log('Tour status updated:', seen);
  } catch (error) {
    logger.error('Error saving tour status:', error);
  }
};

/**
 * Reset the tour status (for testing purposes)
 */
export const resetTourStatus = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOUR_SEEN_KEY);
    logger.log('Tour status reset');
  } catch (error) {
    logger.error('Error resetting tour status:', error);
  }
};








