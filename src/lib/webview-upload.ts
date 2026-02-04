/**
 * WebView file upload: when running in Flutter WebView, <input type="file"> does not work.
 * Request file via Flutter FileUpload channel; Flutter picks file, uploads to /api/upload/, calls back with URL.
 */
import { isWebView } from './api';

declare global {
  interface Window {
    FileUpload?: { postMessage: (msg: string) => void };
    __fileUploadCallback?: (url: string) => void;
  }
}

export interface WebViewUploadOptions {
  accept: string;  // e.g. 'image/*' or 'image/*,application/pdf'
  field: 'logo' | 'kyc_document' | 'whatsapp_image';
}

/**
 * Request a file from Flutter WebView. Only works when isWebView() is true.
 * Flutter will open native picker, upload to /api/upload/, then call window.__fileUploadCallback(url).
 * Returns a Promise that resolves with the media URL when Flutter calls the callback.
 */
export function requestFileFromFlutter(options: WebViewUploadOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isWebView()) {
      reject(new Error('Not in WebView'));
      return;
    }
    const channel = (window as Window & { FileUpload?: { postMessage: (m: string) => void } }).FileUpload;
    if (!channel?.postMessage) {
      reject(new Error('FileUpload channel not available'));
      return;
    }
    const timeout = 120000; // 2 min
    const t = setTimeout(() => {
      window.__fileUploadCallback = undefined;
      reject(new Error('File upload timed out'));
    }, timeout);
    window.__fileUploadCallback = (url: string) => {
      clearTimeout(t);
      window.__fileUploadCallback = undefined;
      resolve(url);
    };
    try {
      channel.postMessage(JSON.stringify({
        accept: options.accept,
        field: options.field,
      }));
    } catch (e) {
      clearTimeout(t);
      window.__fileUploadCallback = undefined;
      reject(e);
    }
  });
}
