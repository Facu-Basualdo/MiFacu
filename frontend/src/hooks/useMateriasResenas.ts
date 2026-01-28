import { useState, useCallback, useEffect, useMemo } from 'react';
import { materiasApi, calificacionesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Tipos
export interface MateriaConResenas {
    id: number;
    numero: number;
    nombre: string;
    nivel: string;
    nivelNumero: number;
    totalResenas: number;
    ratingPromedio: number;
}

export type OrdenTipo = 'resenas_desc' | 'resenas_asc' | 'alfabetico' | 'numero';
export type NivelFiltro = 'todos' | 1 | 2 | 3 | 4 | 5;

interface UseMateriasResenasReturn {
    materias: MateriaConResenas[];
    materiasFiltradas: MateriaConResenas[];
    loading: boolean;
    error: string | null;
    refreshing: boolean;
    isLoggedIn: boolean;
    // Filtros
    nivelFiltro: NivelFiltro;
    setNivelFiltro: (nivel: NivelFiltro) => void;
    ordenTipo: OrdenTipo;
    setOrdenTipo: (orden: OrdenTipo) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    // Acciones
    refetch: () => Promise<void>;
}

// Mapeo de niveles romanos a números
const nivelToNumber = (nivel: string): number => {
    const map: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5 };
    return map[nivel] || 0;
};

/**
 * Hook para cargar materias con estadísticas de reseñas
 * para la pantalla de selección estilo foro
 */
export function useMateriasResenas(): UseMateriasResenasReturn {
    const { user, isGuest } = useAuth();
    const [materias, setMaterias] = useState<MateriaConResenas[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estados de filtros
    const [nivelFiltro, setNivelFiltro] = useState<NivelFiltro>('todos');
    const [ordenTipo, setOrdenTipo] = useState<OrdenTipo>('resenas_desc');
    const [searchQuery, setSearchQuery] = useState('');

    const isLoggedIn = !!user && !isGuest;

    /**
     * Cargar todas las materias con sus estadísticas de reseñas
     */
    const loadData = useCallback(async () => {
        try {
            setError(null);

            // 1. Cargar todas las materias del plan
            const todasMaterias = await materiasApi.getMaterias();

            // Filtrar solo materias del plan (nivel I-V y numero 1-36)
            const nivelesValidos = ['I', 'II', 'III', 'IV', 'V'];
            const materiasDelPlan = todasMaterias.filter((m: any) =>
                m.nivel &&
                nivelesValidos.includes(m.nivel) &&
                m.numero &&
                m.numero >= 1 &&
                m.numero <= 36
            );

            // 2. Cargar estadísticas para cada materia usando el endpoint de promedio
            const materiasConStats: MateriaConResenas[] = await Promise.all(
                materiasDelPlan.map(async (m: any) => {
                    let totalResenas = 0;
                    let ratingPromedio = 0;

                    try {
                        const stats = await calificacionesApi.getPromedioMateria(m.id);
                        totalResenas = stats.total || 0;
                        ratingPromedio = stats.promedio ? Math.round(stats.promedio * 10) / 10 : 0;
                    } catch (e) {
                        // Si falla, dejamos en 0
                        console.warn(`Error cargando stats para materia ${m.id}:`, e);
                    }

                    return {
                        id: m.id,
                        numero: m.numero,
                        nombre: m.nombre,
                        nivel: m.nivel,
                        nivelNumero: nivelToNumber(m.nivel),
                        totalResenas,
                        ratingPromedio,
                    };
                })
            );

            // Ordenar por número de materia por defecto
            materiasConStats.sort((a, b) => a.numero - b.numero);

            setMaterias(materiasConStats);

        } catch (e: any) {
            console.error('Error cargando materias:', e);
            setError('Error al cargar las materias');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    /**
     * Materias filtradas y ordenadas según los filtros actuales
     */
    const materiasFiltradas = useMemo(() => {
        let resultado = [...materias];

        // Filtrar por búsqueda
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            resultado = resultado.filter(m =>
                m.nombre.toLowerCase().includes(query) ||
                m.numero.toString().includes(query)
            );
        }

        // Filtrar por nivel - convertir a número para comparar
        if (nivelFiltro !== 'todos') {
            const nivelNum = typeof nivelFiltro === 'string' ? parseInt(nivelFiltro, 10) : nivelFiltro;
            resultado = resultado.filter(m => m.nivelNumero === nivelNum);
        }

        // Ordenar
        switch (ordenTipo) {
            case 'resenas_desc':
                resultado.sort((a, b) => b.totalResenas - a.totalResenas);
                break;
            case 'resenas_asc':
                resultado.sort((a, b) => a.totalResenas - b.totalResenas);
                break;
            case 'alfabetico':
                resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
                break;
            case 'numero':
            default:
                resultado.sort((a, b) => a.numero - b.numero);
                break;
        }

        return resultado;
    }, [materias, searchQuery, nivelFiltro, ordenTipo]);

    const refetch = useCallback(async () => {
        setRefreshing(true);
        await loadData();
    }, [loadData]);

    // Cargar datos al montar
    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        materias,
        materiasFiltradas,
        loading,
        error,
        refreshing,
        isLoggedIn,
        nivelFiltro,
        setNivelFiltro,
        ordenTipo,
        setOrdenTipo,
        searchQuery,
        setSearchQuery,
        refetch,
    };
}
