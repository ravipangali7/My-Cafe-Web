/**
 * WebView file upload: when running in Flutter WebView, <input type="file"> does not work.
 * Request file via Flutter FileUpload channel; Flutter picks file and returns file data (data URL) to React.
 * React shows preview and uploads to backend only when user clicks Submit/Update.
 */
import { isWebView } from './api';

declare global {
  interface Window {
    FileUpload?: { postMessage: (msg: string) => void };
    __fileUploadCallback?: (payload: WebViewFilePayload) => void;
  }
}

export interface WebViewFilePayload {
  dataUrl: string;
  fileName: string;
  mimeType: string;
}

export interface WebViewUploadOptions {
  accept: string;  // e.g. 'image/*' or 'image/*,application/pdf'
  field: 'logo' | 'kyc_document' | 'whatsapp_image' | 'product_image' | 'category_image';
}

/**
 * Request a file from Flutter WebView. Only works when isWebView() is true.
 * Flutter opens native picker and calls window.__fileUploadCallback({ dataUrl, fileName, mimeType }).
 * Returns a Promise that resolves with the file payload for preview; upload to backend on form Submit.
 */
export function requestFileFromFlutter(options: WebViewUploadOptions): Promise<WebViewFilePayload> {
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
    window.__fileUploadCallback = (payload: WebViewFilePayload) => {
      clearTimeout(t);
      window.__fileUploadCallback = undefined;
      resolve(payload);
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

/**
 * Convert WebView file payload to a File for uploading (e.g. on form submit).
 * Uses base64 decode in JS instead of fetch(dataUrl) to avoid CSP connect-src blocking.
 */
export function filePayloadToFile(payload: WebViewFilePayload): Promise<File> {
  const comma = payload.dataUrl.indexOf(',');
  const base64 = comma >= 0 ? payload.dataUrl.slice(comma + 1) : payload.dataUrl;
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: payload.mimeType });
  return Promise.resolve(new File([blob], payload.fileName, { type: payload.mimeType }));
}
