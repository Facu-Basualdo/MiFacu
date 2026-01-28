import { api, linksApi } from './api';

export const DataRepository = {
    async getRecordatorios() {
        // API call
        try {
            const response = await api.get('/recordatorios');
            // Backend returns { status: 'success', data: [...] }
            return response.data.data;
        } catch (error) {
            console.error("Error fetching recordatorios:", error);
            return [];
        }
    },

    async createRecordatorio(data: any) {
        try {
            const response = await api.post('/recordatorios', data);
            return response.data.data || response.data;
        } catch (error) {
            console.error("Error creating recordatorio:", error);
            throw error;
        }
    },

    async updateRecordatorio(id: number, data: any) {
        try {
            const response = await api.put(`/recordatorios/${id}`, data);
            return response.data.data;
        } catch (error) {
            console.error("Error updating recordatorio:", error);
            throw error;
        }
    },

    async deleteRecordatorio(id: number) {
        try {
            await api.delete(`/recordatorios/${id}`);
        } catch (error) {
            console.error("Error deleting recordatorio:", error);
            throw error;
        }
    },

    async getFinales() {
        try {
            const response = await api.get('/finales');
            return response.data.data;
        } catch (error) {
            console.error("Error fetching finales:", error);
            return [];
        }
    },

    async createFinal(data: any) {
        try {
            const response = await api.post('/finales', data);
            return response.data.data || response.data;
        } catch (error) {
            console.error("Error creating final:", error);
            throw error;
        }
    },

    async deleteFinal(id: number) {
        try {
            await api.delete(`/finales/${id}`);
        } catch (error) {
            console.error("Error deleting final:", error);
            throw error;
        }
    },

    // --- LINKS (REPOSITORIO) ---
    async getLinks() {
        try {
            return await linksApi.getLinks();
        } catch (error) {
            console.error("Error fetching links:", error);
            return [];
        }
    },

    async createLink(data: any) {
        return await linksApi.createLink(data);
    },

    async updateLink(id: number, data: any) {
        return await linksApi.updateLink(id, data);
    },

    async deleteLink(id: number) {
        await linksApi.deleteLink(id);
    }
};
