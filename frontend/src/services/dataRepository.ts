import { api, linksApi } from './api';
import { getLocalData, saveLocalData } from './storage';

const LOCAL_RECORDATORIOS_KEY = 'local_recordatorios';
const LOCAL_FINALES_KEY = 'local_finales';

export const DataRepository = {
    async getRecordatorios(isGuest: boolean) {
        if (isGuest) {
            return (await getLocalData(LOCAL_RECORDATORIOS_KEY)) || [];
        } else {
            // API call
            try {
                const response = await api.get('/recordatorios');
                // Backend returns { status: 'success', data: [...] }
                return response.data.data;
            } catch (error) {
                console.error("Error fetching recordatorios:", error);
                return [];
            }
        }
    },

    async createRecordatorio(isGuest: boolean, data: any) {
        if (isGuest) {
            const current = (await getLocalData(LOCAL_RECORDATORIOS_KEY)) || [];
            // Assign a temp ID
            const newRecordatorio = { ...data, id: Date.now(), isLocal: true };
            const updated = [...current, newRecordatorio];
            await saveLocalData(LOCAL_RECORDATORIOS_KEY, updated);
            return newRecordatorio;
        } else {
            try {
                const response = await api.post('/recordatorios', data);
                return response.data.data || response.data;
            } catch (error) {
                console.error("Error creating recordatorio:", error);
                throw error;
            }
        }
    },

    async updateRecordatorio(isGuest: boolean, id: number, data: any) {
        if (isGuest) {
            const current = (await getLocalData(LOCAL_RECORDATORIOS_KEY)) || [];
            const updated = current.map((r: any) => r.id === id ? { ...r, ...data } : r);
            await saveLocalData(LOCAL_RECORDATORIOS_KEY, updated);
            return updated.find((r: any) => r.id === id);
        } else {
            try {
                const response = await api.put(`/recordatorios/${id}`, data);
                return response.data.data;
            } catch (error) {
                console.error("Error updating recordatorio:", error);
                throw error;
            }
        }
    },

    async deleteRecordatorio(isGuest: boolean, id: number) {
        if (isGuest) {
            const current = (await getLocalData(LOCAL_RECORDATORIOS_KEY)) || [];
            const updated = current.filter((r: any) => r.id !== id);
            await saveLocalData(LOCAL_RECORDATORIOS_KEY, updated);
        } else {
            try {
                await api.delete(`/recordatorios/${id}`);
            } catch (error) {
                console.error("Error deleting recordatorio:", error);
                throw error;
            }
        }
    },

    async getFinales(isGuest: boolean) {
        if (isGuest) {
            return (await getLocalData(LOCAL_FINALES_KEY)) || [];
        } else {
            try {
                const response = await api.get('/finales');
                return response.data.data;
            } catch (error) {
                console.error("Error fetching finales:", error);
                return [];
            }
        }
    },

    async createFinal(isGuest: boolean, data: any) {
        if (isGuest) {
            const current = (await getLocalData(LOCAL_FINALES_KEY)) || [];
            const newFinal = { ...data, id: Date.now(), isLocal: true };
            const updated = [...current, newFinal];
            await saveLocalData(LOCAL_FINALES_KEY, updated);
            return newFinal;
        } else {
            try {
                const response = await api.post('/finales', data);
                return response.data.data || response.data;
            } catch (error) {
                console.error("Error creating final:", error);
                throw error;
            }
        }
    },

    async deleteFinal(isGuest: boolean, id: number) {
        if (isGuest) {
            const current = (await getLocalData(LOCAL_FINALES_KEY)) || [];
            const updated = current.filter((f: any) => f.id !== id);
            await saveLocalData(LOCAL_FINALES_KEY, updated);
        } else {
            try {
                await api.delete(`/finales/${id}`);
            } catch (error) {
                console.error("Error deleting final:", error);
                throw error;
            }
        }
    },

    async syncGuestData() {
        const recordatorios = (await getLocalData(LOCAL_RECORDATORIOS_KEY)) || [];
        const finales = (await getLocalData(LOCAL_FINALES_KEY)) || [];

        if (recordatorios.length === 0 && finales.length === 0) return;

        try {
            await api.post('/sync', { recordatorios, finales });
            // Clear local data after successful sync
            await saveLocalData(LOCAL_RECORDATORIOS_KEY, []);
            await saveLocalData(LOCAL_FINALES_KEY, []);
        } catch (error) {
            console.error("Sync failed:", error);
            // Don't clear data if sync fails
        }
    },

    // --- LINKS (REPOSITORIO) ---
    async getLinks(isGuest: boolean) {
        if (isGuest) {
            return (await getLocalData('local_links')) || [];
        } else {
            try {
                return await linksApi.getLinks();
            } catch (error) {
                console.error("Error fetching links:", error);
                return [];
            }
        }
    },

    async createLink(isGuest: boolean, data: any) {
        if (isGuest) {
            const current = (await getLocalData('local_links')) || [];
            const newLink = { ...data, id: Date.now(), isLocal: true };
            const updated = [...current, newLink];
            await saveLocalData('local_links', updated);
            return newLink;
        } else {
            return await linksApi.createLink(data);
        }
    },

    async updateLink(isGuest: boolean, id: number, data: any) {
        if (isGuest) {
            const current = (await getLocalData('local_links')) || [];
            const updated = current.map((l: any) => l.id === id ? { ...l, ...data } : l);
            await saveLocalData('local_links', updated);
        } else {
            return await linksApi.updateLink(id, data);
        }
    },

    async deleteLink(isGuest: boolean, id: number) {
        if (isGuest) {
            const current = (await getLocalData('local_links')) || [];
            const updated = current.filter((l: any) => l.id !== id);
            await saveLocalData('local_links', updated);
        } else {
            await linksApi.deleteLink(id);
        }
    }
};
