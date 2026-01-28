import { useState, useCallback, useEffect } from 'react';
import { calificacionesApi, materiasApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    CalificacionCatedra,
    CreateCalificacionDTO,
    TipoVoto,
    PromedioMateria,
} from '../types/calificaciones';

interface UseCalificacionesReturn {
    calificaciones: CalificacionCatedra[];
    loading: boolean;
    error: string | null;
    refreshing: boolean;
    isLoggedIn: boolean;
    fetchCalificaciones: (materiaId?: number) => Promise<void>;
    crearCalificacion: (data: CreateCalificacionDTO) => Promise<CalificacionCatedra>;
    votar: (id: number, tipo: TipoVoto) => Promise<void>;
    reportar: (id: number, motivo: string) => Promise<void>;
    eliminarCalificacion: (id: number) => Promise<void>;
    getPromedioMateria: (materiaId: number) => Promise<PromedioMateria>;
    getProfesoresSugeridos: (materiaId: number) => Promise<string[]>;
    refetch: () => Promise<void>;
}

interface MateriaOption {
    id: number;
    nombre: string;
    numero?: number;
}

interface UseMateriasSelectorReturn {
    materias: MateriaOption[];
    loading: boolean;
}

export function useCalificaciones(materiaIdFilter?: number): UseCalificacionesReturn {
    const { user, isGuest } = useAuth();
    const [calificaciones, setCalificaciones] = useState<CalificacionCatedra[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isLoggedIn = !!user && !isGuest;

    const fetchCalificaciones = useCallback(async (materiaId?: number) => {
        try {
            setError(null);
            const data = await calificacionesApi.getAll(materiaId ?? materiaIdFilter);
            setCalificaciones(data);
        } catch (e: any) {
            console.error('Error cargando calificaciones:', e);
            setError('Error al cargar las calificaciones');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [materiaIdFilter]);

    const crearCalificacion = useCallback(async (data: CreateCalificacionDTO): Promise<CalificacionCatedra> => {
        const nueva = await calificacionesApi.create(data);
        // Refetch para obtener la lista actualizada
        await fetchCalificaciones();
        return nueva;
    }, [fetchCalificaciones]);

    const votar = useCallback(async (id: number, tipo: TipoVoto) => {
        // Optimistic update
        setCalificaciones(prev => prev.map(c => {
            if (c.id !== id) return c;

            const votoAnterior = c.miVoto;
            let nuevosUtiles = c.votosUtiles;
            let nuevosNoUtiles = c.votosNoUtiles;
            let nuevoVoto: TipoVoto | null = tipo;

            // Si ya tenia el mismo voto, lo quitamos (toggle)
            if (votoAnterior === tipo) {
                nuevoVoto = null;
                if (tipo === TipoVoto.Util) nuevosUtiles--;
                else nuevosNoUtiles--;
            } else {
                // Si tenia el voto contrario, lo cambiamos
                if (votoAnterior === TipoVoto.Util) {
                    nuevosUtiles--;
                    nuevosNoUtiles++;
                } else if (votoAnterior === TipoVoto.NoUtil) {
                    nuevosNoUtiles--;
                    nuevosUtiles++;
                } else {
                    // No tenia voto
                    if (tipo === TipoVoto.Util) nuevosUtiles++;
                    else nuevosNoUtiles++;
                }
            }

            return {
                ...c,
                miVoto: nuevoVoto,
                votosUtiles: Math.max(0, nuevosUtiles),
                votosNoUtiles: Math.max(0, nuevosNoUtiles),
            };
        }));

        try {
            await calificacionesApi.votar(id, tipo);
        } catch (e) {
            // Revertir en caso de error
            await fetchCalificaciones();
            throw e;
        }
    }, [fetchCalificaciones]);

    const reportar = useCallback(async (id: number, motivo: string) => {
        await calificacionesApi.reportar(id, motivo);
        // Actualizar contador de reportes localmente
        setCalificaciones(prev => prev.map(c =>
            c.id === id ? { ...c, reportes: c.reportes + 1 } : c
        ));
    }, []);

    const eliminarCalificacion = useCallback(async (id: number) => {
        await calificacionesApi.delete(id);
        setCalificaciones(prev => prev.filter(c => c.id !== id));
    }, []);

    const getPromedioMateria = useCallback(async (materiaId: number): Promise<PromedioMateria> => {
        return await calificacionesApi.getPromedioMateria(materiaId);
    }, []);

    const getProfesoresSugeridos = useCallback(async (materiaId: number): Promise<string[]> => {
        return await calificacionesApi.getProfesoresSugeridos(materiaId);
    }, []);

    const refetch = useCallback(async () => {
        setRefreshing(true);
        await fetchCalificaciones();
    }, [fetchCalificaciones]);

    useEffect(() => {
        if (isLoggedIn) {
            fetchCalificaciones();
        } else {
            setLoading(false);
        }
    }, [isLoggedIn, fetchCalificaciones]);

    return {
        calificaciones,
        loading,
        error,
        refreshing,
        isLoggedIn,
        fetchCalificaciones,
        crearCalificacion,
        votar,
        reportar,
        eliminarCalificacion,
        getPromedioMateria,
        getProfesoresSugeridos,
        refetch,
    };
}

// Hook auxiliar para obtener materias del usuario para el selector
export function useMateriasSelector(): UseMateriasSelectorReturn {
    const { user } = useAuth();
    const [materias, setMaterias] = useState<MateriaOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMaterias = async () => {
            if (!user?.id) {
                setLoading(false);
                return;
            }

            try {
                // Obtener materias del usuario (aprobadas o regulares)
                const materiasUsuario = await materiasApi.getMateriasByUsuario(user.id);
                const filtradas = materiasUsuario
                    .filter((m: any) => m.estado === 'aprobado' || m.estado === 'regular')
                    .map((m: any) => ({
                        id: m.materia.id,
                        nombre: m.materia.nombre,
                        numero: m.materia.numero,
                    }));
                setMaterias(filtradas);
            } catch (e) {
                console.error('Error cargando materias:', e);
                // Fallback: cargar todas las materias
                try {
                    const todas = await materiasApi.getMaterias();
                    setMaterias(todas.map((m: any) => ({
                        id: m.id,
                        nombre: m.nombre,
                        numero: m.numero,
                    })));
                } catch (e2) {
                    console.error('Error cargando todas las materias:', e2);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchMaterias();
    }, [user?.id]);

    return { materias, loading };
}
