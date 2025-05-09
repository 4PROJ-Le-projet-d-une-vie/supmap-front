import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import {getAccessToken, getRefreshToken, saveTokens} from './AuthStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

api.interceptors.request.use(
    async (config) => {
        const token = await getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDY2OTY5NzksImlhdCI6MTc0NjYxMDU3OSwicm9sZSI6IlJPTEVfVVNFUiIsInVzZXJJZCI6MX0.yxJ1BE_BcabWmj4cC_CZhxcyKrqPYegd5HemQrvGBt0`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = await getRefreshToken();
                const refreshResponse = await axios.post(`${API_BASE_URL}/refresh`, {
                    refresh_token: refreshToken,
                });

                const { access_token, refresh_token } = refreshResponse.data;

                await saveTokens(access_token, refresh_token);

                originalRequest.headers = {
                    ...originalRequest.headers,
                    Authorization: `Bearer ${access_token}`,
                };

                return api(originalRequest);
            } catch (refreshError) {
                console.error('Refresh token failed:', refreshError);
                throw refreshError;
            }
        }

        return Promise.reject(error);
    }
);

const ApiService = {
    get: async (route: string, params?: any) => {
        const response = await api.get(route, { params });
        return response.data;
    },

    post: async (route: string, data?: any) => {
        const response = await api.post(route, data);
        return response.data;
    },

    patch: async (route: string, data?: any) => {
        const response = await api.patch(route, data);
        return response.data;
    },

    delete: async (route: string) => {
        const response = await api.delete(route);
        return response.data;
    },
};

export default ApiService;
