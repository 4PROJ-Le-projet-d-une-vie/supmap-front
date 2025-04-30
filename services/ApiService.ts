import axios from 'axios';
import { getAccessToken } from './AuthStorage';
const API_BASE_URL = 'http://192.168.1.49:8080'; // remplace avec ton IP locale ou ton domaine

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

api.interceptors.request.use(
    async (config) => {
        const token = await getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const ApiService = {
    get: async (route: string, params?: any) => {
        try {
            const response = await api.get(route, { params });
            return response.data;
        } catch (error) {
            handleError(error);
        }
    },

    post: async (route: string, data?: any) => {
        try {
            const response = await api.post(route, data);
            return response.data;
        } catch (error) {
            handleError(error);
        }
    },

    patch: async (route: string, data?: any) => {
        try {
            const response = await api.patch(route, data);
            return response.data;
        } catch (error) {
            handleError(error);
        }
    },

    delete: async (route: string) => {
        try {
            const response = await api.delete(route);
            return response.data;
        } catch (error) {
            handleError(error);
        }
    },
};

function handleError(error: any) {
    console.error('API Error:', error?.response?.data || error.message);
    throw error;
}

export default ApiService;
