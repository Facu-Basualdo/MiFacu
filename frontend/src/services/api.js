import axios from 'axios';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

// URL base del backend
let API_URL = 'http://localhost:4000';

if (Platform.OS === 'android') {
    API_URL = 'http://10.0.2.2:4000';
} else if (Platform.OS === 'ios') {
    API_URL = 'http://localhost:4000';
}

if (process.env.EXPO_PUBLIC_API_URL) {
    API_URL = process.env.EXPO_PUBLIC_API_URL;
}

console.log('API_URL configurada para:', Platform.OS, '->', API_URL);

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

// Helper functions for backward compatibility or direct usage if needed
export const materiasApi = {
    getMaterias: async () => {
        const response = await api.get('/materias');
        return response.data;
    },
    getMateria: async (id) => {
        const response = await api.get(`/materias/${id}`);
        return response.data;
    }
};
