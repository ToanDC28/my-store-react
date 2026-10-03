import { API_URL } from '@/utils/constant';
import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/** Envelope chuẩn của backend Spring: { statusCode, message, data, timeStamp } */
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timeStamp?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export class ApiError extends Error {
  statusCode: number;
  httpStatus: number;
  fields?: Record<string, string>;

  constructor(message: string, statusCode: number, httpStatus: number, fields?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.httpStatus = httpStatus;
    this.fields = fields;
  }
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh rotation: 1 lượt refresh cho mọi request 401 đồng thời
let refreshPromise: Promise<string> | null = null;

async function rotateTokens(): Promise<string> {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return Promise.reject(new Error('No refresh token'));
    }
    refreshPromise = axios
      .post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        `${API_URL}/api/auth/refresh`,
        { refreshToken },
      )
      .then((res) => {
        const pair = res.data.data;
        setTokens(pair.accessToken, pair.refreshToken);
        return pair.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RetryableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    const url: string = original?.url ?? '';

    // Không retry chính login/refresh (tránh vòng lặp)
    const isAuthCall = url.includes('/api/auth/login') || url.includes('/api/auth/refresh');
    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        const accessToken = await rotateTokens();
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
        return apiClient(original);
      } catch {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(toApiError(error));
  },
);

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const axiosError = error as AxiosError<ApiResponse<Record<string, string> | null>>;
  const httpStatus = axiosError.response?.status ?? 0;
  const body = axiosError.response?.data;
  if (body && typeof body.statusCode === 'number') {
    const fields = body.data && typeof body.data === 'object' ? (body.data as Record<string, string>) : undefined;
    return new ApiError(body.message || 'Request failed', body.statusCode, httpStatus, fields);
  }
  if (axiosError.code === 'ERR_NETWORK') {
    return new ApiError('Không kết nối được tới server (kiểm tra backend :9000)', 0, 0);
  }
  return new ApiError(axiosError.message || 'Request failed', httpStatus, httpStatus);
}

/** Unwrap ApiResponse<T> -> T (ném ApiError khi backend báo lỗi nhưng HTTP 200) */
export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    const res = await promise;
    return res.data.data;
  } catch (e) {
    throw toApiError(e);
  }
}
