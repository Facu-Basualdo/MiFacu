import axios from 'axios';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

// IMPORTANTE: Para React Native, ajusta esta URL según tu entorno:
// - Web/Desktop: 'http://localhost:4000'
// - Android Emulator: 'http://10.0.2.2:4000'
// - iOS Simulator: 'http://localhost:4000'
// - Dispositivo físico: 'http://192.168.0.20:4000' (tu IP local actual)

// Detección automática del entorno
let API_URL = 'http://localhost:4000';

if (Platform.OS === 'android') {
    // Si usas emulador, 10.0.2.2 es lo ideal. Si usas celular físico, cambia a la IP .20
    API_URL = 'http://192.168.0.20:4000';
} else if (Platform.OS === 'ios') {
    API_URL = 'http://192.168.0.20:4000';
}

// Permitir override por variables de entorno de Expo
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

// Funciones para interactuar con el backend
export const materiasApi = {
    getMaterias: async () => {
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
