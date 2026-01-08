/**
 * Push Notification Service
 * Handles Expo push notifications setup and management
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';
import { endpoints } from '../api/endpoints';
import { createScopedLogger } from '@/lib/logger';

const logger = createScopedLogger('PushService');

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    logger.warn('Push notifications only work on physical devices');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  return true;
}

/**
 * Get Expo push token
 */
export async function getPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync();

    return token.data;
  } catch (error) {
    logger.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Register for push notifications
 */
export async function registerForPushNotifications(userId: string, userName: string): Promise<boolean> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return false;
    }

    const token = await getPushToken();
    if (!token) {
      return false;
    }

    // Register with backend
    await apiClient.post(endpoints.notifications.subscribe, {
      endpoint: token,
      agentId: userId,
      agentName: userName,
    });

    // Set up notification listeners
    setupNotificationListeners();

    return true;
  } catch (error) {
    logger.error('Error registering for push notifications:', error);
    return false;
  }
}

/**
 * Unregister from push notifications
 */
export async function unregisterFromPushNotifications(endpoint: string): Promise<void> {
  try {
    await apiClient.delete(endpoints.notifications.unsubscribe, {
      data: { endpoint },
    });
  } catch (error) {
    logger.error('Error unregistering from push notifications:', error);
  }
}

/**
 * Setup notification listeners
 */
function setupNotificationListeners() {
  // Handle notification received while app is in foreground
  Notifications.addNotificationReceivedListener((notification) => {
    logger.log('Notification received:', notification);
    // You can show a custom in-app notification here
  });

  // Handle notification tap
  Notifications.addNotificationResponseReceivedListener((response) => {
    logger.log('Notification tapped:', response);
    const data = response.notification.request.content.data;
    
    // Navigate based on notification data
    if (data?.screen) {
      // TODO: Navigate to specific screen
      logger.log('Navigate to:', data.screen);
    }
  });
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Show immediately
  });
}

