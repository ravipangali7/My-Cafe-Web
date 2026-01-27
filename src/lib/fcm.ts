/**
 * FCM (Firebase Cloud Messaging) utility functions
 */
import { getFCMToken } from './firebase-config';
import { api } from './api';

/**
 * Detect if running in a Flutter webview environment
 */
function isFlutterWebView(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || '';
  // Flutter webview often has specific user agent patterns
  const isWebView = /wv|WebView/i.test(userAgent) || 
                    /Android.*wv/i.test(userAgent) ||
                    // Check for Flutter-specific indicators
                    (window as any).flutter_inappwebview !== undefined;
  
  return isWebView;
}

/**
 * Wait for a specified amount of time
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
  const isWebViewEnv = isFlutterWebView();
  const maxRetries = isWebViewEnv ? 3 : 1;
  const retryDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (isWebViewEnv && attempt > 1) {
        console.log(`[WebView] FCM token retrieval and save attempt ${attempt}/${maxRetries}`);
        await delay(retryDelay * attempt);
      }

      // Request notification permission first
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        const message = isWebViewEnv
          ? '[WebView] Notification permission not granted. FCM token cannot be retrieved.'
          : 'Notification permission not granted';
        console.warn(message);
        return null; // Don't retry for permission issues
      }

      // Get FCM token
      const token = await getFCMToken();
      if (!token) {
        if (attempt === maxRetries) {
          const message = isWebViewEnv
            ? `[WebView] Failed to get FCM token after ${maxRetries} attempts. This may be due to webview limitations.`
            : 'Failed to get FCM token';
          console.warn(message);
          return null;
        }
        // Retry if not last attempt
        continue;
      }

      // Try to save token to backend (but don't fail if this doesn't work)
      try {
        const response = await api.post<{ message: string; token_id: number }>('/api/auth/user/fcm-token/', {
          token,
        });

        if (response.error) {
          // Log error but still return token
          const errorMessage = isWebViewEnv
            ? `[WebView] Failed to save FCM token to backend: ${response.error}`
            : `Failed to save FCM token to backend: ${response.error}`;
          console.error(errorMessage);
          // Check if it's an authentication error
          if (response.status === 401) {
            console.warn('User not authenticated, token not saved to account');
          }
        } else {
          if (isWebViewEnv) {
            console.log('[WebView] FCM token saved to backend successfully');
          }
        }
      } catch (saveError: any) {
        // Log error but still return token
        const errorMessage = saveError?.message || String(saveError);
        const logMessage = isWebViewEnv
          ? `[WebView] Error saving FCM token to backend: ${errorMessage}`
          : `Error saving FCM token to backend: ${errorMessage}`;
        console.error(logMessage);
      }

      // Always return token even if saving failed
      if (isWebViewEnv && attempt > 1) {
        console.log('[WebView] FCM token retrieved successfully after retry');
      }
      return token;
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      if (attempt === maxRetries) {
        const logMessage = isWebViewEnv
          ? `[WebView] Error in getAndSaveFCMToken after ${maxRetries} attempts: ${errorMessage}`
          : `Error in getAndSaveFCMToken: ${errorMessage}`;
        console.error(logMessage);
        return null;
      } else {
        console.warn(
          isWebViewEnv
            ? `[WebView] Error in getAndSaveFCMToken (attempt ${attempt}/${maxRetries}), retrying...: ${errorMessage}`
            : `Error in getAndSaveFCMToken, retrying...: ${errorMessage}`
        );
      }
    }
  }

  return null;
}
