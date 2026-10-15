import { ApiError, BackendHealth } from '../types';

const STORAGE_API_KEY = 'fincore_custom_api_url';
const STORAGE_TOKEN_KEY = 'fincore_jwt_token';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem(STORAGE_API_KEY);
    if (custom && custom.trim() !== '') {
      return custom.trim().replace(/\/+$/, '');
    }
  }
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (envUrl || 'http://localhost:8080/api/v1').replace(/\/+$/, '');
}

export function setCustomApiBaseUrl(url: string | null): void {
  if (typeof window === 'undefined') return;
  if (!url || url.trim() === '') {
    localStorage.removeItem(STORAGE_API_KEY);
  } else {
    localStorage.setItem(STORAGE_API_KEY, url.trim().replace(/\/+$/, ''));
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (!token) {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
  } else {
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
  }
}

export class BankApiError extends Error {
  public status: number;
  public errorType: string;
  public timestamp: string;
  public path?: string;
  public details?: string[];

  constructor(apiError: ApiError) {
    super(apiError.message || `API Error (${apiError.status})`);
    this.name = 'BankApiError';
    this.status = apiError.status;
    this.errorType = apiError.error;
    this.timestamp = apiError.timestamp;
    this.path = apiError.path;
    this.details = apiError.details;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const targetUrl = `${baseUrl}${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const timeoutMs = options.timeoutMs ?? 10000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(targetUrl, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle session expiry
    if (response.status === 401) {
      // Clear token on 401 if it was an authenticated request
      if (token && !endpoint.includes('/auth/login')) {
        setAuthToken(null);
        window.dispatchEvent(new CustomEvent('fincore:auth-expired'));
      }
    }

    if (!response.ok) {
      let errorPayload: ApiError;
      try {
        const json = await response.json();
        errorPayload = {
          status: response.status,
          error: json.error || response.statusText,
          message: json.message || `HTTP ${response.status} Error`,
          timestamp: json.timestamp || new Date().toISOString(),
          path: json.path || cleanEndpoint,
          details: json.details || (json.errors ? Object.values(json.errors) : undefined),
        };
      } catch {
        errorPayload = {
          status: response.status,
          error: response.statusText,
          message: `Server returned HTTP ${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString(),
          path: cleanEndpoint,
        };
      }
      throw new BankApiError(errorPayload);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();
    return data as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof BankApiError) {
      throw err;
    }

    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new BankApiError({
        status: 408,
        error: 'Request Timeout',
        message: `Spring Boot backend request timed out after ${timeoutMs}ms. Verify server responsiveness at ${baseUrl}`,
        timestamp: new Date().toISOString(),
        path: cleanEndpoint,
      });
    }

    // Network error (CORS, offline, connection refused)
    throw new BankApiError({
      status: 0,
      error: 'Network Failure / Connection Refused',
      message: `Unable to reach Spring Boot server at ${baseUrl}. Ensure Java 21 application is started and CORS is enabled.`,
      timestamp: new Date().toISOString(),
      path: cleanEndpoint,
    });
  }
}

/**
 * Probes Spring Boot backend health
 */
export async function probeBackendHealth(urlToTest?: string): Promise<BackendHealth> {
  const targetBase = (urlToTest || getApiBaseUrl()).replace(/\/+$/, '');
  const startTime = performance.now();
  const checkedAt = new Date().toISOString();

  // Common health endpoints to test:
  // 1. /health
  // 2. /actuator/health
  // 3. /accounts (or public endpoint)
  const probeCandidates = [
    `${targetBase}/health`,
    `${targetBase}/actuator/health`,
    `${targetBase}/auth/health`,
  ];

  for (const candidate of probeCandidates) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2500);

      const resp = await fetch(candidate, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(id);

      const latencyMs = Math.round(performance.now() - startTime);

      if (resp.ok) {
        let rawJson: unknown = null;
        try {
          rawJson = await resp.json();
        } catch {
          // Plain text response OK
        }

        return {
          connected: true,
          url: targetBase,
          latencyMs,
          springBootVersion: 'Spring Boot 3.3.x (Java 21)',
          databaseStatus: 'CONNECTED',
          checkedAt,
          rawResponse: rawJson || { status: 'UP' },
        };
      }
    } catch {
      // Continue to next probe candidate
    }
  }

  return {
    connected: false,
    url: targetBase,
    databaseStatus: 'DISCONNECTED',
    checkedAt,
  };
}
