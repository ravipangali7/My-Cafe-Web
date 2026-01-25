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
      console.log('Firebase initialized successfully');
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
  const messagingInstance = getFirebaseMessaging();
  if (!messagingInstance) {
    console.warn('Firebase Messaging not available. Check Firebase configuration.');
    return null;
  }

  if (!vapidKey) {
    console.warn('VAPID key not configured. FCM token cannot be generated. Please set VITE_FIREBASE_VAPID_KEY in .env file.');
    return null;
  }

  try {
    const token = await getToken(messagingInstance, { vapidKey });
    if (token) {
      console.log('FCM token obtained successfully');
      return token;
    } else {
      console.warn('No FCM token available. User may need to grant notification permission.');
      return null;
    }
  } catch (error: any) {
    // Handle specific Firebase errors
    if (error?.code === 'messaging/notifications-blocked') {
      console.warn('Notifications are blocked by the browser. Please enable notifications in browser settings.');
    } else if (error?.code === 'messaging/permission-default') {
      console.warn('Notification permission not yet granted. User needs to allow notifications.');
    } else if (error?.code === 'messaging/failed-service-worker-registration') {
      console.error('Service worker registration failed. Make sure firebase-messaging-sw.js exists in the public directory and is accessible.');
      console.error('Error details:', error.message);
    } else if (error?.code === 'messaging/unsupported-browser') {
      console.warn('This browser does not support Firebase Cloud Messaging.');
    } else {
      console.error('Error getting FCM token:', error);
      if (error?.message) {
        console.error('Error message:', error.message);
      }
    }
    return null;
  }
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
