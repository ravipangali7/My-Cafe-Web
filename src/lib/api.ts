// Use relative path if VITE_API_BASE_URL is empty (for Vite proxy), otherwise use the configured URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Rewrite backend media URL to same-origin /media-proxy/ so fetch works without CORS.
 * Use when fetching a logo (e.g. for QR) from a cross-origin backend media URL.
 */
export function getMediaProxyUrl(logoUrl: string | null | undefined): string | null | undefined {
  if (logoUrl == null || logoUrl === '') return logoUrl;
  const base = (API_BASE_URL || '').replace(/\/$/, '');
  const mediaPrefix = base ? `${base}/media` : '';
  if (mediaPrefix && typeof window !== 'undefined' && logoUrl.startsWith(mediaPrefix)) {
    const pathAfterMedia = logoUrl.slice(mediaPrefix.length);
    return `${window.location.origin}/media-proxy${pathAfterMedia}`;
  }
  return logoUrl;
}

/** Detect WebView (Android/iOS) where blob-URL download often fails; direct URL in new window or SaveFile channel lets OS handle download. */
export function isWebView(): boolean {
  if (typeof window !== 'undefined' && (window as Window & { __FLUTTER_WEBVIEW__?: boolean }).__FLUTTER_WEBVIEW__ === true) {
    return true;
  }
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /wv|WebView/i.test(ua) || /Android.*wv/i.test(ua);
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status?: number; // HTTP status code
}

class ApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAuthToken();

    const headers: HeadersInit = {
      ...options.headers,
    };

    // Don't set Content-Type for FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Add auth token if available (for session-based auth, we use cookies)
    // For token-based auth, uncomment below:
    // if (token) {
    //   headers['Authorization'] = `Token ${token}`;
    // }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Include cookies for session auth
      redirect: 'manual', // Don't automatically follow redirects
    };

    try {
      const response = await fetch(url, config);
      
      // Handle redirects explicitly - including opaque redirects from CORS
      // When redirect: 'manual' is used with CORS, redirects return status 0 and type "opaqueredirect"
      if (response.status === 0 && response.type === 'opaqueredirect') {
        return {
          error: 'Authentication required. Please log in again.',
          status: 401,
        };
      }
      
      if (response.status === 302 || response.status === 301 || response.status === 307 || response.status === 308) {
        const location = response.headers.get('location');
        // If redirecting to login page, return authentication error
        if (location && (location.includes('/login') || location.includes('login'))) {
          return {
            error: 'Authentication required. Please log in again.',
            status: 401,
          };
        }
        // For other redirects, return error
        return {
          error: `Unexpected redirect to: ${location || 'unknown location'}`,
          status: response.status,
        };
      }
      
      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      const hasJsonContent = contentType && contentType.includes('application/json');
      
      let data: any = {};
      
      // Only try to parse JSON if content-type indicates JSON and response has body
      if (hasJsonContent) {
        try {
          const text = await response.text();
          if (text) {
            data = JSON.parse(text);
          }
        } catch (parseError) {
          // If JSON parsing fails, use empty object
          data = {};
        }
      }

      if (!response.ok) {
        // Return error response with status code information
        return {
          error: data.error || data.message || `Request failed with status ${response.status}`,
          status: response.status,
        };
      }

      return { data, status: response.status };
    } catch (error) {
      // Network errors or fetch failures
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | null | undefined>
  ): Promise<ApiResponse<T>> {
    const url = params && Object.keys(params).length > 0
      ? `${endpoint}${this.buildQueryString(params)}`
      : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    body?: any,
    isFormData: boolean = false
  ): Promise<ApiResponse<T>> {
    const options: RequestInit = {
      method: 'POST',
    };

    if (isFormData && body instanceof FormData) {
      options.body = body;
    } else if (body) {
      options.body = JSON.stringify(body);
    }

    return this.request<T>(endpoint, options);
  }

  async put<T>(endpoint: string, body?: any, isFormData: boolean = false): Promise<ApiResponse<T>> {
    const options: RequestInit = {
      method: 'PUT',
    };

    if (isFormData && body instanceof FormData) {
      options.body = body;
    } else if (body) {
      options.body = JSON.stringify(body);
    }

    return this.request<T>(endpoint, options);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Helper method to build query string
  buildQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }
}

export const api = new ApiClient();

// Helper types for paginated responses
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Helper function to fetch paginated data
export async function fetchPaginated<T>(
  endpoint: string,
  params: {
    search?: string;
    page?: number;
    page_size?: number;
    user_id?: number;
    [key: string]: string | number | boolean | null | undefined;
  } = {}
): Promise<ApiResponse<PaginatedResponse<T>>> {
  const queryString = api.buildQueryString(params);
  return api.get<PaginatedResponse<T>>(`${endpoint}${queryString}`);
}

// Invoice API functions
export async function generateOrderInvoice(orderId: number): Promise<ApiResponse<{
  invoice: {
    id: number;
    invoice_number: string;
    order_id: number;
    total_amount: string;
    pdf_url: string;
    generated_at: string;
    created: boolean;
  };
}>> {
  return api.post(`/api/orders/${orderId}/invoice/generate/`);
}

/** Open a URL in external browser via Flutter WebView channel, or fallback to window.open */
export function openInBrowser(url: string): void {
  const w = typeof window !== 'undefined' 
    ? (window as Window & { OpenInBrowser?: { postMessage?: (msg: string) => void } }) 
    : null;
  if (w?.OpenInBrowser?.postMessage) {
    w.OpenInBrowser.postMessage(url);
  } else {
    window.open(url, '_blank');
  }
}

/** Get public invoice view URL (call requires auth). Returned URL is public and points to the frontend (e.g. /invoice/public/{orderId}/{token}); open it without auth. Use for opening invoice in browser from WebView. */
export async function getPublicInvoiceUrl(orderId: number): Promise<string> {
  const response = await api.get<{ url: string; order_id: number; token: string }>(
    `/api/orders/${orderId}/invoice/public-url/`
  );
  if (response.error || !response.data?.url) {
    throw new Error(response.error || 'Failed to get invoice link');
  }
  return response.data.url;
}

export async function downloadOrderInvoice(orderId: number): Promise<void> {
  const url = `${API_BASE_URL}/api/orders/${orderId}/invoice/download/`;
  const headers: HeadersInit = {};
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const config: RequestInit = {
    method: 'GET',
    headers,
    credentials: 'include',
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to download invoice: ${response.statusText}`);
  }

  const blob = await response.blob();
  const filename = `invoice_order_${orderId}.pdf`;
  const mimeType = 'application/pdf';

  // In WebView: send PDF to Flutter via SaveFile so it saves locally and opens in system PDF viewer (no Chrome).
  if (isWebView()) {
    const w = typeof window !== 'undefined' ? (window as Window & { SaveFile?: { postMessage?: (msg: string) => void } }) : null;
    if (w?.SaveFile?.postMessage) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('Failed to read blob'));
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      w.SaveFile.postMessage(JSON.stringify({ dataUrl, filename, mimeType }));
      return;
    }
    // Fallback if SaveFile channel missing: try programmatic download (often fails in WebView).
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    return;
  }

  // Regular browser: download via object URL.
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
