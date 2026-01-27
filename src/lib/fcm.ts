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
 * Enhanced for webview environments
 * @returns Promise<boolean> - true if permission granted, false otherwise
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const isWebViewEnv = isFlutterWebView();
  
  if (!('Notification' in window)) {
    const message = isWebViewEnv
      ? '[WebView] Notification API not available. This may be a webview limitation.'
      : 'This browser does not support notifications';
    console.warn(message);
    return false;
  }

  // Check current permission status
  if (Notification.permission === 'granted') {
    if (isWebViewEnv) {
      console.log('[WebView] Notification permission already granted');
    }
    return true;
  }

  if (Notification.permission === 'denied') {
    const message = isWebViewEnv
      ? '[WebView] Notification permission has been denied. User needs to enable it in app settings.'
      : 'Notification permission has been denied';
    console.warn(message);
    return false;
  }

  // Permission is 'default' - request it
  // In webview, add a small delay to ensure APIs are ready
  if (isWebViewEnv) {
    console.log('[WebView] Requesting notification permission...');
    await delay(300); // Small delay for webview
  }

  try {
    // Ensure requestPermission returns a Promise
    let permissionPromise: Promise<NotificationPermission>;
    
    if (typeof Notification.requestPermission === 'function') {
      const result = Notification.requestPermission();
      if (result instanceof Promise) {
        permissionPromise = result;
      } else {
        // Some browsers return a string directly
        permissionPromise = Promise.resolve(result as NotificationPermission);
      }
    } else {
      // Fallback: try using the callback-based API
      permissionPromise = new Promise<NotificationPermission>((resolve) => {
        const result = Notification.requestPermission((permission) => {
          resolve(permission);
        });
        if (result !== undefined) {
          resolve(result as NotificationPermission);
        }
      });
    }

    const permission = await permissionPromise;
    const granted = permission === 'granted';
    
    if (isWebViewEnv) {
      console.log(`[WebView] Notification permission result: ${permission}`);
    }
    
    return granted;
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    const logMessage = isWebViewEnv
      ? `[WebView] Error requesting notification permission: ${errorMessage}`
      : `Error requesting notification permission: ${errorMessage}`;
    console.error(logMessage);
    return false;
  }
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
