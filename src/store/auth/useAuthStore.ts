import { create } from 'zustand';
import User from "@/type";
import { axiosInstance } from '@/lib/axios';
import { jwtDecode } from 'jwt-decode';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}
interface MyTokenPayload {
    "tenant": string;
    "exp": number;
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string;
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": string;
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": string;
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname": string;
    "fullName": string;
    "image_url": string;
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone": string;
    "ipAddress": string;
    "permission": string[];
    // ...add other claims as needed
  }
  

interface AuthActions {
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshToken: (token:string, refreshToken:string) => Promise<void>;
    setError: (error: string | null) => void;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
    ...initialState,
    
    login: async (email: string, password: string) => {
        try {
            set({ isLoading: true, error: null });
            
            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }
            const response = await axiosInstance.post('/tokens', { email, password });
            const data = response.data;

            try {
                const decoded = jwtDecode<MyTokenPayload>(data.token);
                localStorage.setItem('token', data.token);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('tenant', decoded.tenant);
                localStorage.setItem('exp', decoded.exp.toString());
                localStorage.setItem('refreshTokenExpiryTime', data.refreshTokenExpiryTime);
                set({
                    user: {
                        id: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
                        email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
                        name: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
                        surName: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'],
                        fullName: decoded['fullName'],
                        avatar: decoded['image_url'],
                        phone: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone'],
                        ipAddress: decoded['ipAddress'],
                        permissions: decoded['permission'],
                    },
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                });
                console.log("User logged in:", get().user);
            } catch (decodeError) {
                console.error('Error decoding token:', decodeError);
                throw new Error('Invalid token received');
            }
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'An error occurred during login',
            });
            throw error; // Re-throw to handle in the component
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('refreshTokenExpiryTime');
        localStorage.removeItem('exp');
        localStorage.removeItem('tenant');
        set({
            user: null,
            isAuthenticated: false,
            error: null,
        });
    },

    refreshToken: async (token:string, refreshToken:string) => {
        const response = await axiosInstance.post('/tokens/refresh', { token, refreshToken });
        const data = response.data;
        try {
            const decoded = jwtDecode<MyTokenPayload>(data.token);
            localStorage.setItem('token', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('tenant', decoded.tenant);
            localStorage.setItem('exp', decoded.exp.toString());
            localStorage.setItem('refreshTokenExpiryTime', data.refreshTokenExpiryTime);
            set({
                user: {
                    id: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
                    email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
                    name: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
                    surName: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'],
                    fullName: decoded['fullName'],
                    avatar: decoded['image_url'],
                    phone: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone'],
                    ipAddress: decoded['ipAddress'],
                    permissions: decoded['permission'],
                },
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'An error occurred during refresh token',
            });
        }
    },
    setError: (error: string | null) => {
        set({ error });
    },
}));

export default useAuthStore;

