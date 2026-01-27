import axios from 'axios';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

// IMPORTANTE: Para React Native, ajusta esta URL según tu entorno:
// - Web/Desktop: 'http://localhost:4000'
// - Android Emulator: 'http://10.0.2.2:4000'
// - iOS Simulator: 'http://localhost:4000'
// - Dispositivo físico: 'http://192.168.0.20:4000' (tu IP local actual)

// Detección automática del entorno
let API_URL = 'https://mifacu-backend-production.up.railway.app'; // URL de Railway de Producción

if (__DEV__) {
    // En desarrollo, usamos la IP local para dispositivos físicos
    // Cambia esta IP si tu red local cambia
    API_URL = 'http://192.168.0.20:4000';
}

// Permitir override por variables de entorno de Expo (útil para TestFlight/Config externa)
if (process.env.EXPO_PUBLIC_API_URL) {
    API_URL = process.env.EXPO_PUBLIC_API_URL;
}

// Si necesitas forzar la IP para tu celular físico sin tocar envs, puedes hacerlo aquí:
// API_URL = 'http://192.168.0.20:4000'; 

console.log('API_URL configurada para:', Platform.OS, '->', API_URL);

export const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
    } catch (error) {
        console.error('Error getting supabase session:', error);
    }
    return config;
});

// Retry logic para errores de servidor (5xx) y errores de red
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;

        // No reintentar si no hay config o ya se reintentó 3 veces
        if (!config || config._retryCount >= 3) {
            return Promise.reject(error);
        }

        config._retryCount = config._retryCount || 0;

        // Reintentar solo para errores 5xx o errores de red
        const shouldRetry =
            !error.response || // Error de red
            (error.response.status >= 500 && error.response.status < 600);

        if (shouldRetry) {
            config._retryCount += 1;
            console.log(`Reintentando request (${config._retryCount}/3):`, config.url);

            // Esperar antes de reintentar (backoff exponencial)
            const delay = Math.pow(2, config._retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));

            return api(config);
        }

        return Promise.reject(error);
    }
);

// Funciones para interactuar con el backend
export const materiasApi = {
    getMaterias: async () => {
        const response = await api.get('/materias');
        return response.data.data || response.data;
    },

    // Obtener materias con correlativas para el simulador
    getMateriasConCorrelativas: async () => {
        const response = await api.get('/materias');
        return response.data.data || response.data;
    },

    getMateria: async (id) => {
        const response = await api.get(`/materias/${id}`);
        return response.data.data || response.data;
    },

    // Usuario Materias
    getMateriasByUsuario: async (usuarioId) => {
        const response = await api.get(`/usuario-materias/${usuarioId}`);
        return response.data.data || response.data;
    },

    getMateriasDisponibles: async (usuarioId) => {
        const response = await api.get(`/usuario-materias/${usuarioId}/disponibles`);
        return response.data.data || response.data;
    },

    addMateriaToUsuario: async (usuarioId, materiaId, estado = null, schedule = {}) => {
        const body = { materiaId, ...schedule };
        if (estado) body.estado = estado;
        const response = await api.post(`/usuario-materias/${usuarioId}`, body);
        return response.data.data || response.data;
    },

    updateEstadoMateria: async (usuarioId, materiaId, estado, schedule = {}) => {
        const response = await api.put(`/usuario-materias/${usuarioId}/${materiaId}`, { estado, ...schedule });
        return response.data.data || response.data;
    },

    removeMateriaFromUsuario: async (usuarioId, materiaId) => {
        const response = await api.delete(`/usuario-materias/${usuarioId}/${materiaId}`);
        return true;
    }
};

// API de Correlativas
export const correlativasApi = {
    // Obtener todas las correlativas agrupadas por materia
    getCorrelativas: async () => {
        const response = await api.get('/correlativas');
        return response.data.data || response.data;
    },

    // Obtener correlativas de una materia específica
    getCorrelativasByMateria: async (materiaId) => {
        const response = await api.get(`/correlativas/${materiaId}`);
        return response.data.data || response.data;
    }
};

export const linksApi = {
    getLinks: async () => {
        const response = await api.get('/links');
        return response.data.data || response.data;
    },
    createLink: async (data) => {
        const response = await api.post('/links', data);
        return response.data.data || response.data;
    },
    updateLink: async (id, data) => {
        const response = await api.put(`/links/${id}`, data);
        return response.data.data || response.data;
    },
    deleteLink: async (id) => {
        await api.delete(`/links/${id}`);
        return true;
    }
};

// Exportar objeto api por defecto o como nombrado
export default api;
