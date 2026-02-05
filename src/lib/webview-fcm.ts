/**
 * WebView FCM bridge: request FCM token from Flutter for logout.
 * When React runs inside Flutter WebView, the native FCM token must be sent to the backend
 * so it can be deleted before session invalidation. Flutter provides the token via this channel.
 */
import { isWebView } from './api';

const CHANNEL_NAME = 'RequestFCMTokenForLogout';
const TIMEOUT_MS = 5000;

declare global {
  interface Window {
    RequestFCMTokenForLogout?: { postMessage: (msg: string) => void };
    __onFCMTokenForLogout__?: (token: string | null) => void;
  }
}

/**
 * Request the current device FCM token from Flutter for use in logout.
 * Only runs when isWebView() is true; otherwise resolves with null.
 * Flutter listens on the RequestFCMTokenForLogout channel and calls
 * window.__onFCMTokenForLogout__(token) to resolve the Promise.
 * Times out after 5s and resolves with null if Flutter does not respond.
 */
export function requestFCMTokenFromFlutterForLogout(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!isWebView()) {
      resolve(null);
      return;
    }

    const channel = (window as Window & { RequestFCMTokenForLogout?: { postMessage: (m: string) => void } })
      .RequestFCMTokenForLogout;
    if (!channel?.postMessage) {
      resolve(null);
      return;
    }

    const cleanup = () => {
      window.__onFCMTokenForLogout__ = undefined;
    };

    const t = setTimeout(() => {
      cleanup();
      resolve(null);
    }, TIMEOUT_MS);

    window.__onFCMTokenForLogout__ = (token: string | null) => {
      clearTimeout(t);
      cleanup();
      resolve(token && token.trim() ? token.trim() : null);
    };

    try {
      channel.postMessage('request');
    } catch {
      clearTimeout(t);
      cleanup();
      resolve(null);
    }
  });
}
