/**
 * Firebase configuration for FCM (Firebase Cloud Messaging)
 * 
 * To set up Firebase:
 * 1. Go to Firebase Console (https://console.firebase.google.com/)
 * 2. Create a new project or select existing one
 * 3. Go to Project Settings > General
 * 4. Scroll down to "Your apps" and click the web icon (</>)
 * 5. Register your app and copy the config object
 * 6. Add the values to your .env file
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, Messaging, onMessage } from 'firebase/messaging';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

// VAPID key for web push notifications
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

// Initialize Firebase app
let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

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
 * Register the service worker for Firebase Messaging
 * This must be called before getFCMToken()
 * Includes retry logic for webview environments
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (serviceWorkerRegistration) {
    return serviceWorkerRegistration;
  }

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    const isWebViewEnv = isFlutterWebView();
    console.warn(
      isWebViewEnv 
        ? 'Service workers may not be supported in this webview environment. FCM token retrieval may fail.'
        : 'Service workers are not supported in this browser.'
    );
    return null;
  }

  const isWebViewEnv = isFlutterWebView();
  const maxRetries = isWebViewEnv ? 3 : 1;
  const retryDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (isWebViewEnv && attempt > 1) {
        console.log(`[WebView] Service worker registration attempt ${attempt}/${maxRetries}`);
        await delay(retryDelay * attempt); // Exponential backoff
      }

      // Register the service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      });

      // Wait for the service worker to be ready with timeout
      const readyPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Service worker ready timeout')), 10000)
      );

      await Promise.race([readyPromise, timeoutPromise]);
      
      serviceWorkerRegistration = registration;

      // Send Firebase config to service worker
      const sendConfig = () => {
        if (registration.active) {
          registration.active.postMessage({
            type: 'FIREBASE_CONFIG',
            config: firebaseConfig,
          });
        } else if (registration.installing) {
          // Wait for service worker to become active
          registration.installing.addEventListener('statechange', () => {
            if (registration.active) {
              registration.active.postMessage({
                type: 'FIREBASE_CONFIG',
                config: firebaseConfig,
              });
            }
          });
        } else if (registration.waiting) {
          registration.waiting.postMessage({
            type: 'FIREBASE_CONFIG',
            config: firebaseConfig,
          });
        }
      };

      sendConfig();

      if (isWebViewEnv) {
        console.log('[WebView] Service worker registered successfully');
      }

      return registration;
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error(
        isWebViewEnv
          ? `[WebView] Service worker registration failed (attempt ${attempt}/${maxRetries}):`
          : 'Service worker registration failed:',
        errorMessage
      );

      if (attempt === maxRetries) {
        if (isWebViewEnv) {
          console.error(
            '[WebView] All service worker registration attempts failed. ' +
            'This may be due to webview limitations. FCM token retrieval will not work.'
          );
        }
        return null;
      }
    }
  }

  return null;
}

export function initializeFirebase(): FirebaseApp | null {
  if (app) {
    return app;
  }

  // Check if config is valid
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('Firebase configuration is missing. FCM will not work. Please check your .env file.');
    return null;
  }

  // Initialize app if not already initialized
  try {
    const apps = getApps();
    if (apps.length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = apps[0];
    }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return null;
  }

  return app;
}

export function getFirebaseMessaging(): Messaging | null {
  if (messaging) {
    return messaging;
  }

  if (typeof window === 'undefined') {
    // Server-side rendering - messaging not available
    return null;
  }

  const app = initializeFirebase();
  if (!app) {
    return null;
  }

  try {
    messaging = getMessaging(app);
    
    // Send Firebase config to service worker for background message handling
    // This needs to happen after service worker is registered
    if ('serviceWorker' in navigator) {
      // Try to send config immediately if service worker is already active
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({
            type: 'FIREBASE_CONFIG',
            config: firebaseConfig,
          });
        } else if (registration.installing) {
          // If service worker is installing, wait for it to become active
          registration.installing.addEventListener('statechange', () => {
            if (registration.active) {
              registration.active.postMessage({
                type: 'FIREBASE_CONFIG',
                config: firebaseConfig,
              });
            }
          });
        }
      }).catch((error) => {
        console.warn('Failed to send config to service worker:', error);
      });

      // Also listen for service worker controller changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'FIREBASE_CONFIG',
            config: firebaseConfig,
          });
        }
      });
    }
    
    return messaging;
  } catch (error: any) {
    // Handle service worker registration errors specifically
    if (error?.code === 'messaging/failed-service-worker-registration') {
      console.error('Failed to register service worker. Make sure firebase-messaging-sw.js exists in the public directory.');
    } else {
      console.error('Failed to initialize Firebase Messaging:', error);
    }
    return null;
  }
}

export async function getFCMToken(): Promise<string | null> {
  const isWebViewEnv = isFlutterWebView();
  
  // First, ensure service worker is registered
  const registration = await registerServiceWorker();
  if (!registration) {
    const message = isWebViewEnv
      ? '[WebView] Service worker not registered. FCM token cannot be retrieved. This may be a webview limitation.'
      : 'Service worker not registered. Cannot get FCM token.';
    console.warn(message);
    return null;
  }

  // Wait for service worker to be ready with timeout
  try {
    const readyPromise = navigator.serviceWorker.ready;
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Service worker ready timeout')), 10000)
    );
    await Promise.race([readyPromise, timeoutPromise]);
  } catch (error) {
    console.error(
      isWebViewEnv
        ? '[WebView] Service worker did not become ready in time.'
        : 'Service worker did not become ready in time.',
      error
    );
    return null;
  }

  const messagingInstance = getFirebaseMessaging();
  if (!messagingInstance) {
    console.warn('Firebase Messaging not available. Check Firebase configuration.');
    return null;
  }

  if (!vapidKey) {
    console.warn('VAPID key not configured. FCM token cannot be generated. Please set VITE_FIREBASE_VAPID_KEY in .env file.');
    return null;
  }

  // Retry logic for webview environments
  const maxRetries = isWebViewEnv ? 3 : 1;
  const retryDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (isWebViewEnv && attempt > 1) {
        console.log(`[WebView] FCM token retrieval attempt ${attempt}/${maxRetries}`);
        await delay(retryDelay * attempt);
      }

      const token = await getToken(messagingInstance, { vapidKey });
      if (token) {
        if (isWebViewEnv) {
          console.log('[WebView] FCM token retrieved successfully');
        }
        return token;
      } else {
        console.warn('No FCM token available. User may need to grant notification permission.');
        return null;
      }
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      const errorCode = error?.code;

      // Handle specific Firebase errors
      if (errorCode === 'messaging/notifications-blocked') {
        console.warn('Notifications are blocked by the browser. Please enable notifications in browser settings.');
        return null; // Don't retry for permission issues
      } else if (errorCode === 'messaging/permission-default') {
        console.warn('Notification permission not yet granted. User needs to allow notifications.');
        return null; // Don't retry for permission issues
      } else if (errorCode === 'messaging/failed-service-worker-registration') {
        console.error('Service worker registration failed. Make sure firebase-messaging-sw.js exists in the public directory and is accessible.');
        console.error('Error details:', errorMessage);
        if (attempt === maxRetries) return null; // Don't retry if service worker registration failed
      } else if (errorCode === 'messaging/unsupported-browser') {
        console.warn('This browser does not support Firebase Cloud Messaging.');
        return null; // Don't retry for unsupported browser
      } else {
        if (attempt === maxRetries) {
          console.error(
            isWebViewEnv
              ? `[WebView] Error getting FCM token after ${maxRetries} attempts:`
              : 'Error getting FCM token:',
            errorMessage
          );
          if (error?.message) {
            console.error('Error message:', error.message);
          }
          return null;
        } else {
          console.warn(
            isWebViewEnv
              ? `[WebView] FCM token retrieval failed (attempt ${attempt}/${maxRetries}), retrying...`
              : 'FCM token retrieval failed, retrying...',
            errorMessage
          );
        }
      }
    }
  }

  return null;
}

export function onMessageListener(): Promise<any> {
  return new Promise((resolve) => {
    const messagingInstance = getFirebaseMessaging();
    if (!messagingInstance) {
      return;
    }
    onMessage(messagingInstance, (payload) => {
      resolve(payload);
    });
  });
}
