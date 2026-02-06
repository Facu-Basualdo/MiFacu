import axios from 'axios';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

// IMPORTANTE: Para React Native, ajusta esta URL según tu entorno:
// - Web/Desktop: 'http://localhost:4000'
// - Android Emulator: 'http://10.0.2.2:4000'
// - iOS Simulator: 'http://localhost:4000'
// - Dispositivo físico: 'http://192.168.0.51:4000' (tu IP local actual)

// Detección automática del entorno
let API_URL = 'https://mifacu-production.up.railway.app'; // URL de Railway de Producción

if (__DEV__) {
    // En desarrollo, usamos la IP local para dispositivos físicos
    // Cambia esta IP si tu red local cambia
    API_URL = 'http://192.168.0.51:4000';
}

// Permitir override por variables de entorno de Expo (útil para TestFlight/Config externa)
if (process.env.EXPO_PUBLIC_API_URL) {
    API_URL = process.env.EXPO_PUBLIC_API_URL;
}

// Si necesitas forzar la IP para tu celular físico sin tocar envs, puedes hacerlo aquí:
// API_URL = 'http://192.168.0.51:4000'; 

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
    getMaterias: async (carreraId) => {
        const params = carreraId ? { params: { carreraId } } : {};
        const response = await api.get('/materias', params);
        return response.data.data || response.data;
    },

    // Obtener materias con correlativas para el simulador
    getMateriasConCorrelativas: async (carreraId = null) => {
        const params = carreraId ? { params: { carreraId } } : {};
        const response = await api.get('/materias', params);
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

// API de Carreras y Universidades
export const academicApi = {
    getUniversidades: async () => {
        const response = await api.get('/carreras/universidades');
        return response.data.data || response.data;
    },
    getCarreras: async (universidadId) => {
        const response = await api.get(`/carreras/universidades/${universidadId}/carreras`);
        return response.data.data || response.data;
    }
};

// API de Usuarios
export const usersApi = {
    getProfile: async (userId) => {
        const response = await api.get(`/users/${userId}`);
        return response.data.data || response.data;
    },
    updateCareer: async (userId, carreraId) => {
        const response = await api.put(`/users/${userId}/career`, { carreraId });
        return response.data.data || response.data;
    }
};

// API de Calificaciones de Catedras
export const calificacionesApi = {
    getAll: async (materiaId = null) => {
        const params = materiaId ? `?materiaId=${materiaId}` : '';
        const response = await api.get(`/calificaciones-catedras${params}`);
        return response.data.data || response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/calificaciones-catedras/${id}`);
        return response.data.data || response.data;
    },
    create: async (data) => {
        const response = await api.post('/calificaciones-catedras', data);
        return response.data.data || response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/calificaciones-catedras/${id}`, data);
        return response.data.data || response.data;
    },
    delete: async (id) => {
        await api.delete(`/calificaciones-catedras/${id}`);
        return true;
    },
    votar: async (id, tipo) => {
        const response = await api.post(`/calificaciones-catedras/${id}/voto`, { tipo });
        return response.data.data || response.data;
    },
    reportar: async (id, motivo) => {
        const response = await api.post(`/calificaciones-catedras/${id}/reportar`, { motivo });
        return response.data;
    },
    getPromedioMateria: async (materiaId) => {
        const response = await api.get(`/calificaciones-catedras/materia/${materiaId}/promedio`);
        return response.data.data || response.data;
    },
    getProfesoresSugeridos: async (materiaId) => {
        const response = await api.get(`/calificaciones-catedras/materia/${materiaId}/profesores`);
        return response.data.data || response.data;
    }
};

// API de Comentarios de Calificaciones
export const comentariosApi = {
    getByCalificacion: async (calificacionId) => {
        const response = await api.get(`/comentarios-calificaciones/${calificacionId}`);
        return response.data.data || response.data;
    },
    getCount: async (calificacionId) => {
        const response = await api.get(`/comentarios-calificaciones/${calificacionId}/count`);
        return response.data.data || response.data;
    },
    create: async (calificacionId, data) => {
        const response = await api.post(`/comentarios-calificaciones/${calificacionId}`, data);
        return response.data.data || response.data;
    },
    delete: async (id) => {
        await api.delete(`/comentarios-calificaciones/${id}`);
        return true;
    }
};

// API de Pomodoro
export const pomodoroApi = {
    complete: async (data) => {
        const response = await api.post('/pomodoro', data);
        return response.data.data || response.data;
    },
    getStats: async (userId) => {
        const response = await api.get(`/pomodoro/stats/${userId}`);
        return response.data.data || response.data;
    },
    getHistory: async (userId) => {
        const response = await api.get(`/pomodoro/history/${userId}`);
        return response.data.data || response.data;
    },
};

// API de Gamificación
export const gamificationApi = {
    getProfile: async (userId) => {
        const response = await api.get(`/gamification/${userId}`);
        return response.data.data || response.data;
    },
    completeSession: async (data) => {
        const response = await api.post('/gamification/complete-session', data);
        return response.data.data || response.data;
    },
};

// API de Temas de Finales (La Fija)
export const temasFinalesApi = {
    getAll: async (materiaId = null) => {
        const params = materiaId ? `?materiaId=${materiaId}` : '';
        const response = await api.get(`/temas-finales${params}`);
        return response.data.data || response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/temas-finales/${id}`);
        return response.data.data || response.data;
    },
    create: async (data) => {
        const response = await api.post('/temas-finales', data);
        return response.data.data || response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/temas-finales/${id}`, data);
        return response.data.data || response.data;
    },
    delete: async (id) => {
        await api.delete(`/temas-finales/${id}`);
        return true;
    },
    votar: async (id, tipo) => {
        const response = await api.post(`/temas-finales/${id}/voto`, { tipo });
        return response.data.data || response.data;
    },
    reportar: async (id, motivo) => {
        const response = await api.post(`/temas-finales/${id}/reportar`, { motivo });
        return response.data;
    },
    getEstadisticasMateria: async (materiaId) => {
        const response = await api.get(`/temas-finales/materia/${materiaId}/estadisticas`);
        return response.data.data || response.data;
    },
};

// Exportar objeto api por defecto o como nombrado
export default api;
