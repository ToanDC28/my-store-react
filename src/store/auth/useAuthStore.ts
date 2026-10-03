import { create } from 'zustand';
import User from '@/type';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '@/api/auth';
import { ApiError, clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/lib/api-client';

/** Claims của backend Spring (JwtService): sub=username, email, roles[], permissions[], type, jti */
interface BackendTokenPayload {
  sub: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  type?: string;
  exp: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setError: (error: string | null) => void;
  checkAuth: () => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

function buildUser(payload: BackendTokenPayload, profile?: { fullName?: string | null; enabled?: boolean }): User {
  return {
    id: 0,
    username: payload.sub,
    email: payload.email ?? '',
    fullName: profile?.fullName ?? null,
    enabled: profile?.enabled ?? true,
    roles: payload.roles ?? [],
    permissions: payload.permissions ?? [],
  };
}

const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  ...initialState,

  login: async (username: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const pair = await authApi.login(username.trim(), password);
      setTokens(pair.accessToken, pair.refreshToken);
      const payload = jwtDecode<BackendTokenPayload>(pair.accessToken);
      // Lấy fullName/enabled từ /me (JWT không có)
      let profile: { fullName?: string | null; enabled?: boolean } | undefined;
      try {
        const me = await authApi.me();
        profile = { fullName: me.fullName, enabled: me.enabled };
      } catch {
        profile = undefined;
      }
      set({ user: buildUser(payload, profile), isAuthenticated: true, isLoading: false, error: null });
    } catch (error) {
      clearTokens();
      const message = error instanceof ApiError ? error.message : 'Đăng nhập thất bại';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout(getRefreshToken());
    } catch {
      // logout best-effort: token hỏng vẫn xóa local
    } finally {
      clearTokens();
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  checkAuth: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ user: null, isAuthenticated: false });
      return false;
    }
    try {
      const payload = jwtDecode<BackendTokenPayload>(token);
      if (payload.exp * 1000 < Date.now()) {
        // Access hết hạn: interceptor sẽ tự refresh ở request tới;
        // ở đây thử refresh 1 lần để giữ session
        const rk = getRefreshToken();
        if (!rk) {
          get().logout();
          return false;
        }
        try {
          const pair = await authApi.refresh(rk);
          setTokens(pair.accessToken, pair.refreshToken);
          const fresh = jwtDecode<BackendTokenPayload>(pair.accessToken);
          set({ user: buildUser(fresh), isAuthenticated: true });
          return true;
        } catch {
          get().logout();
          return false;
        }
      }
      // Token còn hạn: dựng user từ claims (profile chi tiết lấy lazy ở màn profile)
      if (!get().user) {
        set({ user: buildUser(payload), isAuthenticated: true });
      } else {
        set({ isAuthenticated: true });
      }
      return true;
    } catch {
      get().logout();
      return false;
    }
  },

  hasPermission: (permission: string) => get().user?.permissions.includes(permission) ?? false,
  hasRole: (role: string) => get().user?.roles.includes(role) ?? false,

  setError: (error: string | null) => {
    set({ error });
  },
}));

export default useAuthStore;
