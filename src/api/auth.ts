import { apiClient, unwrap, type PageResponse } from '@/lib/api-client';
import type { UserResponse } from './types';

export interface AuthPair {
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: (username: string, password: string) =>
    unwrap<AuthPair>(apiClient.post('/api/auth/login', { username, password })),

  refresh: (refreshToken: string) =>
    unwrap<AuthPair>(apiClient.post('/api/auth/refresh', { refreshToken })),

  logout: (refreshToken?: string | null) =>
    unwrap<void>(apiClient.post('/api/auth/logout', refreshToken ? { refreshToken } : {})),

  logoutAll: () => unwrap<void>(apiClient.post('/api/auth/logout-all')),

  me: () => unwrap<UserResponse>(apiClient.get('/api/auth/me')),

  changePassword: (oldPassword: string, newPassword: string) =>
    unwrap<void>(apiClient.post('/api/auth/change-password', { oldPassword, newPassword })),
};

export interface SearchParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
  [key: string]: unknown;
}

/** Gộp params search (bỏ undefined/null) cho @ParameterObject/@ModelAttribute */
export function toParams<T extends SearchParams>(p: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export type { PageResponse };
