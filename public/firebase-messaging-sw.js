/**
 * Firebase Cloud Messaging Service Worker
 * 
 * This service worker handles background push notifications when the app is not in the foreground.
 * It must be placed in the public directory to be accessible at the root path.
 */

// Import Firebase SDK from CDN (compat version for service workers)
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Firebase configuration - will be set by the main app via postMessage
let firebaseConfig = null;
let messaging = null;
let isInitialized = false;

// Listen for configuration from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    if (!isInitialized) {
      initializeFirebase();
    }
  }
});

/**
 * Initialize Firebase in the service worker
 */
function initializeFirebase() {
  if (!firebaseConfig) {
    console.warn('[SW] Firebase config not received yet, will initialize when config is available');
    return false;
  }

  if (isInitialized) {
    return true;
  }

  try {
    // Initialize Firebase app
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.log('[SW] Firebase initialized successfully');
    }

    // Initialize Firebase Messaging
    messaging = firebase.messaging();

    // Set up background message handler
    messaging.onBackgroundMessage((payload) => {
      console.log('[SW] Received background message:', payload);

      try {
        // Handle notification payload (with notification object)
        if (payload.notification) {
          const notificationTitle = payload.notification.title || 'New Notification';
          const notificationOptions = {
            body: payload.notification.body || '',
            icon: payload.notification.icon || '/favicon.ico',
            badge: '/favicon.ico',
            tag: payload.data?.order_id || payload.data?.tag || 'notification',
            data: payload.data || {},
            requireInteraction: false,
            silent: false,
          };

          return self.registration.showNotification(notificationTitle, notificationOptions);
        }
        
        // Handle data-only payload (no notification object, but has data)
        if (payload.data && (payload.data.title || payload.data.body)) {
          const notificationTitle = payload.data.title || 'New Notification';
          const notificationOptions = {
            body: payload.data.body || '',
            icon: payload.data.icon || '/favicon.ico',
            badge: '/favicon.ico',
            tag: payload.data.order_id || payload.data.tag || 'notification',
            data: payload.data || {},
            requireInteraction: false,
            silent: false,
          };

          return self.registration.showNotification(notificationTitle, notificationOptions);
        }

        console.warn('[SW] Received message with no notification or data:', payload);
      } catch (error) {
        console.error('[SW] Error showing notification:', error);
      }
    });

    isInitialized = true;
    console.log('[SW] Firebase Messaging initialized successfully');
    return true;
  } catch (error) {
    console.error('[SW] Error initializing Firebase:', error);
    return false;
  }
}

// Try to initialize immediately if firebase is already available (for compatibility)
if (typeof firebase !== 'undefined') {
  // Wait a bit for potential config message
  setTimeout(() => {
    if (!isInitialized && firebaseConfig) {
      initializeFirebase();
    }
  }, 100);
  
  // Also try again after a longer delay in case config arrives late
  setTimeout(() => {
    if (!isInitialized && firebaseConfig) {
      initializeFirebase();
    }
  }, 1000);
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();

  // Handle click action - you can customize this based on your needs
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    // Default: focus or open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});

// Handle push events
// Always show notifications when notification data is present, regardless of Firebase initialization
// Firebase's onBackgroundMessage is a convenience wrapper, but we handle push events directly
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[SW] Push data:', data);
      
      // Always show notification if notification data is present
      if (data.notification) {
        const notificationTitle = data.notification.title || 'New Notification';
        const notificationOptions = {
          body: data.notification.body || '',
          icon: data.notification.icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: data.data?.order_id || 'notification',
          data: data.data || {},
          requireInteraction: false,
          silent: false,
        };
        
        console.log('[SW] Showing notification:', notificationTitle);
        event.waitUntil(
          self.registration.showNotification(notificationTitle, notificationOptions)
        );
      } else if (data.data && (data.data.title || data.data.body)) {
        // Handle data-only payload (no notification object, but has title/body in data)
        const notificationTitle = data.data.title || 'New Notification';
        const notificationOptions = {
          body: data.data.body || '',
          icon: data.data.icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: data.data.order_id || 'notification',
          data: data.data || {},
          requireInteraction: false,
          silent: false,
        };
        
        console.log('[SW] Showing notification from data:', notificationTitle);
        event.waitUntil(
          self.registration.showNotification(notificationTitle, notificationOptions)
        );
      } else {
        console.warn('[SW] Push event has no notification data to display');
      }
    } catch (error) {
      console.error('[SW] Error handling push event:', error);
    }
  } else {
    console.warn('[SW] Push event has no data');
  }
});

console.log('[SW] Firebase Messaging Service Worker loaded');
