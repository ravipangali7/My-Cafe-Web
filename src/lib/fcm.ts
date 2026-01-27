/**
 * FCM (Firebase Cloud Messaging) utility functions
 */
import { getFCMToken } from './firebase-config';
import { api } from './api';

/**
 * Request notification permission from the user
 * @returns Promise<boolean> - true if permission granted, false otherwise
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission has been denied');
    return false;
  }

  // Permission is 'default' - request it
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Get FCM token only (without saving to backend)
 * Use this for public pages where user is not authenticated
 * @returns Promise<string | null> - FCM token if successful, null otherwise
 */
export async function getFCMTokenOnly(): Promise<string | null> {
  try {
    // Request notification permission first
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return null;
    }

    // Get FCM token
    const token = await getFCMToken();
    if (!token) {
      console.warn('Failed to get FCM token');
      return null;
    }

    return token;
  } catch (error) {
    console.error('Error in getFCMTokenOnly:', error);
    return null;
  }
}

/**
 * Get FCM token and save it to the backend
 * Use this for authenticated pages (dashboard, etc.)
 * @returns Promise<string | null> - FCM token if successful, null otherwise
 * Note: Returns token even if saving fails, so it can still be used
 */
export async function getAndSaveFCMToken(): Promise<string | null> {
  try {
    // Request notification permission first
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return null;
    }

    // Get FCM token
    const token = await getFCMToken();
    if (!token) {
      console.warn('Failed to get FCM token');
      return null;
    }

    // Try to save token to backend (but don't fail if this doesn't work)
    try {
      const response = await api.post<{ message: string; token_id: number }>('/api/auth/user/fcm-token/', {
        token,
      });

      if (response.error) {
        // Log error but still return token
        console.error('Failed to save FCM token to backend:', response.error);
        // Check if it's an authentication error
        if (response.status === 401) {
          console.warn('User not authenticated, token not saved to account');
        }
      }
    } catch (saveError) {
      // Log error but still return token
      console.error('Error saving FCM token to backend:', saveError);
    }

    // Always return token even if saving failed
    return token;
  } catch (error) {
    console.error('Error in getAndSaveFCMToken:', error);
    return null;
  }
}
