import { API_URL } from '@/utils/constant';
import axios from 'axios';

export const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'tenant': 'root',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// axiosInstance.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const originalRequest = error.config;

//         if (error.response?.status === 401 && !originalRequest._retry) {
//             originalRequest._retry = true;

//             try {
//                 const refreshToken = localStorage.getItem('refreshToken');
//                 if (!refreshToken) {
//                     throw new Error('No refresh token available');
//                 }

//                 const response = await axios.post(`${env.apiUrl}/api/token/refresh`, {
//                     refresh_token: refreshToken,
//                 });

//                 const { token } = response.data;
//                 localStorage.setItem('token', token);

//                 originalRequest.headers.Authorization = `Bearer ${token}`;
//                 return axiosInstance(originalRequest);
//             } catch (refreshError) {
//                 localStorage.removeItem('token');
//                 localStorage.removeItem('refreshToken');
//                 window.location.href = '/login';
//                 return Promise.reject(refreshError);
//             }
//         }

//         return Promise.reject(error);
//     }
// );
