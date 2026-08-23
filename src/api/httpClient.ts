import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@api/env';
import { clearAccessToken, getAccessToken, setAccessToken } from './tokenStore';

export { API_BASE_URL };

/** Dispatched on `window` when a silent refresh fails — the session cannot be recovered. */
export const SESSION_EXPIRED_EVENT = 'routinemate:session-expired';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  // Required so the browser sends/receives the httpOnly refresh-token
  // cookie — the backend's CORS config sets credentials: true to match.
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Ensures a burst of concurrent 401s only triggers a single /auth/refresh
// call — every request that hits this while one is already in flight awaits
// the same promise instead of racing separate refreshes.
let refreshPromise: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ data: { accessToken: string } }>(`${API_BASE_URL}/api/auth/refresh`, undefined, {
        withCredentials: true,
      })
      .then((response) => {
        const token = response.data?.data?.accessToken ?? null;
        setAccessToken(token);
        return token;
      })
      .catch(() => {
        clearAccessToken();
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const isRefreshEndpoint = original?.url?.includes('/auth/refresh');

    if (status === 401 && original && !original._retry && !isRefreshEndpoint) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return httpClient(original);
      }
    }

    return Promise.reject(error);
  },
);
