import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { materiasApi, correlativasApi } from '../services/api';
import { apiToVisual, puedeDesbloquear, EstadoVisual } from '../utils/estadoMapper';

// Tipo para las correlativas del backend
interface CorrelativaBackend {
  materiaId: number;
  reqsRegularizadas: number[];
  reqsAprobadas: number[];
}

// Correlativas del Plan de Estudios UTN FRRE - Ingenieria en Sistemas de Informacion (2023)
// Mapeadas por NUMERO de materia (1-36)
// Formato: { regularizadas: [...], aprobadas: [...] }
// - regularizadas: materias que necesitas tener REGULARIZADAS para cursar
// - aprobadas: materias que necesitas tener APROBADAS (con final) para cursar
interface CorrelativasMateria {
  regularizadas: number[];
  aprobadas: number[];
}

const CORRELATIVAS_POR_NUMERO: Record<number, CorrelativasMateria> = {
  // === NIVEL 1 - Primer Año (8 materias) - Sin correlativas ===
  1: { regularizadas: [], aprobadas: [] },   // Análisis Matemático I
  2: { regularizadas: [], aprobadas: [] },   // Álgebra y Geometría Analítica
  3: { regularizadas: [], aprobadas: [] },   // Física I
  4: { regularizadas: [], aprobadas: [] },   // Inglés I
  5: { regularizadas: [], aprobadas: [] },   // Lógica y Estructuras Discretas
  6: { regularizadas: [], aprobadas: [] },   // Algoritmos y Estructuras de Datos
  7: { regularizadas: [], aprobadas: [] },   // Arquitectura de Computadoras
  8: { regularizadas: [], aprobadas: [] },   // Sistemas y Procesos de Negocios

  // === NIVEL 2 - Segundo Año (9 materias) ===
  9: { regularizadas: [1, 2], aprobadas: [] },       // Análisis Matemático II
  10: { regularizadas: [1, 3], aprobadas: [] },      // Física II
  11: { regularizadas: [], aprobadas: [] },          // Ingeniería y Sociedad
  12: { regularizadas: [4], aprobadas: [] },         // Inglés II
  13: { regularizadas: [5, 6], aprobadas: [] },      // Sintaxis y Semántica de los Lenguajes
  14: { regularizadas: [5, 6], aprobadas: [] },      // Paradigmas de Programación
  15: { regularizadas: [7], aprobadas: [] },         // Sistemas Operativos
  16: { regularizadas: [6, 8], aprobadas: [] },      // Análisis de Sistemas de Información
  17: { regularizadas: [1, 2], aprobadas: [1, 2] },  // Probabilidades y Estadísticas

  // === NIVEL 3 - Tercer Año (6 materias) ===
  18: { regularizadas: [1, 2], aprobadas: [1, 2] },           // Economía
  19: { regularizadas: [13, 16], aprobadas: [5, 6] },         // Base de Datos
  20: { regularizadas: [14, 16], aprobadas: [5, 6] },         // Desarrollo de Software
  21: { regularizadas: [], aprobadas: [3, 7] },               // Comunicaciones de Datos
  22: { regularizadas: [9], aprobadas: [1, 2] },              // Análisis Numérico
  23: { regularizadas: [14, 16], aprobadas: [1, 2, 4, 6, 8] }, // Diseño de Sistemas de Información

  // === NIVEL 4 - Cuarto Año (7 materias) ===
  24: { regularizadas: [11], aprobadas: [] },                 // Legislación
  25: { regularizadas: [19, 20, 23], aprobadas: [13, 14] },   // Ingeniería y Calidad de Software
  26: { regularizadas: [15, 21], aprobadas: [] },             // Redes de Datos
  27: { regularizadas: [17, 22], aprobadas: [9] },            // Investigación Operativa
  28: { regularizadas: [17], aprobadas: [9] },                // Simulación
  29: { regularizadas: [10, 22], aprobadas: [] },             // Tecnologías para la Automatización
  30: { regularizadas: [18, 23], aprobadas: [16] },           // Administración de Sistemas de Información

  // === NIVEL 5 - Quinto Año (6 materias) ===
  31: { regularizadas: [28], aprobadas: [17, 22] },           // Inteligencia Artificial
  32: { regularizadas: [28], aprobadas: [17, 19] },           // Ciencia de Datos
  33: { regularizadas: [18, 27], aprobadas: [23] },           // Sistemas de Gestión
  34: { regularizadas: [24, 30], aprobadas: [18] },           // Gestión Gerencial
  35: { regularizadas: [26, 30], aprobadas: [20, 21] },       // Seguridad en los Sistemas de Información
  36: { regularizadas: [25, 26, 30], aprobadas: [12, 20, 23] }, // Proyecto Final
};

// Tipos
export interface MateriaBackend {
  id: number;
  numero: number;
  nombre: string;
  nivel: string;
  duracion: string;
}

export interface MateriaUsuario {
  id: number;
  estado: string;
  materia: {
    id: number;
    nombre: string;
    numero?: number;
  };
}

export interface MateriaSimulador {
  id: number;        // ID del backend (para API calls)
  numero: number;    // Numero de la materia en el plan
  nombre: string;
  nivel: number;
  col: number;
  reqs: number[];    // IDs de todas las correlativas (para compatibilidad)
  reqsRegularizadas: number[];  // IDs de materias que necesitas REGULARIZADAS
  reqsAprobadas: number[];      // IDs de materias que necesitas APROBADAS
  estado: EstadoVisual;
}

export interface SimuladorStats {
  aprobadas: number;
  regulares: number;
  cursando: number;
  restantes: number;
  total: number;
  porcentaje: number;
}

interface UseSimuladorDataReturn {
  materias: MateriaSimulador[];
  stats: SimuladorStats;
  loading: boolean;
  error: string | null;
  isLoggedIn: boolean;
  refetch: () => Promise<void>;
  updateMateriaEstado: (materiaId: number, nuevoEstado: EstadoVisual) => Promise<void>;
}

// Mapeo de niveles romanos a numeros
const nivelToNumber = (nivel: string): number => {
  const map: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5 };
  return map[nivel] || 0;
};

/**
 * Hook para manejar datos del simulador de plan de estudios
 */
export function useSimuladorData(): UseSimuladorDataReturn {
  const { user, isGuest } = useAuth();

  const [materias, setMaterias] = useState<MateriaSimulador[]>([]);
  const [stats, setStats] = useState<SimuladorStats>({
    aprobadas: 0,
    regulares: 0,
    cursando: 0,
    restantes: 0,
    total: 0,
    porcentaje: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!user && !isGuest;

  /**
   * Recalcula estados basado en correlativas (cascada)
   * Verifica dos tipos de requisitos:
   * - reqsRegularizadas: pueden estar regularizadas O aprobadas
   * - reqsAprobadas: deben estar APROBADAS (con final)
   */
  const recalcularCascada = useCallback((lista: MateriaSimulador[]): MateriaSimulador[] => {
    if (!lista.length) return [];

    let nuevaLista = [...lista];

    // 3 pasadas para asegurar propagacion completa
    for (let i = 0; i < 3; i++) {
      nuevaLista = nuevaLista.map(materia => {
        // Nivel 1 nunca esta bloqueada
        if (materia.nivel === 1) {
          if (materia.estado === 'bloqueada') {
            return { ...materia, estado: 'pendiente' as EstadoVisual };
          }
          return materia;
        }

        // Verificar requisitos de materias REGULARIZADAS (pueden estar regularizadas o aprobadas)
        const regularizadasCumplidas = materia.reqsRegularizadas.length === 0 ||
          materia.reqsRegularizadas.every(reqId => {
            const matRequisito = nuevaLista.find(m => m.id === reqId);
            return matRequisito && (matRequisito.estado === 'regularizada' || matRequisito.estado === 'aprobada');
          });

        // Verificar requisitos de materias APROBADAS (deben estar aprobadas con final)
        const aprobadasCumplidas = materia.reqsAprobadas.length === 0 ||
          materia.reqsAprobadas.every(reqId => {
            const matRequisito = nuevaLista.find(m => m.id === reqId);
            return matRequisito && matRequisito.estado === 'aprobada';
          });

        const requisitosCumplidos = regularizadasCumplidas && aprobadasCumplidas;

        if (requisitosCumplidos) {
          if (materia.estado === 'bloqueada') {
            return { ...materia, estado: 'pendiente' as EstadoVisual };
          }
        } else {
          if (materia.estado !== 'aprobada' && materia.estado !== 'regularizada') {
            return { ...materia, estado: 'bloqueada' as EstadoVisual };
          }
        }

        return materia;
      });
    }

    return nuevaLista;
  }, []);

  /**
   * Calcula estadisticas
   */
  const calcularStats = useCallback((lista: MateriaSimulador[]): SimuladorStats => {
    const aprobadas = lista.filter(m => m.estado === 'aprobada').length;
    const regulares = lista.filter(m => m.estado === 'regularizada').length;
    const cursando = lista.filter(m => m.estado === 'pendiente').length;
    const restantes = lista.filter(m => m.estado === 'bloqueada').length;
    const total = lista.length;
    const porcentaje = total > 0 ? Math.round((aprobadas / total) * 100) : 0;

    return { aprobadas, regulares, cursando, restantes, total, porcentaje };
  }, []);

  /**
   * Carga datos del backend
   */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Cargar todas las materias del backend
      let materiasBackend: MateriaBackend[] = [];
      try {
        const todas = await materiasApi.getMaterias();
        // Filtrar solo materias del plan (nivel I-V y numero 1-36)
        const nivelesValidos = ['I', 'II', 'III', 'IV', 'V'];
        materiasBackend = todas.filter((m: MateriaBackend) =>
          m.nivel &&
          nivelesValidos.includes(m.nivel) &&
          m.numero &&
          m.numero >= 1 &&
          m.numero <= 36
        );
        // Ordenar por numero
        materiasBackend.sort((a, b) => a.numero - b.numero);
      } catch (e) {
        console.error('Error cargando materias del backend:', e);
        setError('No se pudieron cargar las materias');
        setLoading(false);
        return;
      }

      if (materiasBackend.length === 0) {
        setError('No hay materias en el plan de estudios');
        setLoading(false);
        return;
      }

      // 2. Crear mapas de IDs
      const numeroToId = new Map<number, number>();
      const idToNumero = new Map<number, number>();
      materiasBackend.forEach(m => {
        if (m.numero) {
          numeroToId.set(m.numero, m.id);
          idToNumero.set(m.id, m.numero);
        }
      });

      // 3. Cargar correlativas del backend (con fallback a hardcodeadas)
      let correlativasBackend: CorrelativaBackend[] = [];
      let usarCorrelativasBackend = false;
      try {
        correlativasBackend = await correlativasApi.getCorrelativas();
        if (correlativasBackend && correlativasBackend.length > 0) {
          usarCorrelativasBackend = true;
        }
      } catch (e) {
        // Fallback silencioso a correlativas hardcodeadas
      }

      // Crear mapa de correlativas por ID de materia (del backend o hardcodeadas)
      const correlativasPorId = new Map<number, { reqsRegularizadas: number[], reqsAprobadas: number[] }>();

      if (usarCorrelativasBackend) {
        // Usar correlativas del backend (ya vienen por ID)
        correlativasBackend.forEach(c => {
          correlativasPorId.set(c.materiaId, {
            reqsRegularizadas: c.reqsRegularizadas,
            reqsAprobadas: c.reqsAprobadas,
          });
        });
      } else {
        // Usar correlativas hardcodeadas (convertir números a IDs)
        Object.entries(CORRELATIVAS_POR_NUMERO).forEach(([numero, correlativas]) => {
          const materiaId = numeroToId.get(Number(numero));
          if (materiaId) {
            correlativasPorId.set(materiaId, {
              reqsRegularizadas: correlativas.regularizadas
                .map(num => numeroToId.get(num))
                .filter((id): id is number => id !== undefined),
              reqsAprobadas: correlativas.aprobadas
                .map(num => numeroToId.get(num))
                .filter((id): id is number => id !== undefined),
            });
          }
        });
      }

      // 5. Cargar estados del usuario si esta logueado
      const estadosPorMateriaId = new Map<number, string>();
      if (user?.id) {
        try {
          const materiasUsuario: MateriaUsuario[] = await materiasApi.getMateriasByUsuario(user.id);
          materiasUsuario.forEach(mu => {
            estadosPorMateriaId.set(mu.materia.id, mu.estado);
          });
        } catch (e) {
          console.warn('No se pudieron cargar estados del usuario:', e);
        }
      }

      // 6. Agrupar por nivel para calcular columnas
      const porNivel: Record<number, MateriaBackend[]> = {};
      materiasBackend.forEach(m => {
        const nivel = nivelToNumber(m.nivel);
        if (nivel > 0) {
          if (!porNivel[nivel]) porNivel[nivel] = [];
          porNivel[nivel].push(m);
        }
      });

      // Ordenar cada nivel por numero
      Object.values(porNivel).forEach(arr => {
        arr.sort((a, b) => (a.numero || 0) - (b.numero || 0));
      });

      // 7. Transformar a formato del simulador
      const materiasSimulador: MateriaSimulador[] = materiasBackend.map(m => {
        const nivel = nivelToNumber(m.nivel);
        const materiasEnNivel = porNivel[nivel] || [];
        const col = materiasEnNivel.findIndex(mat => mat.id === m.id);

        // Obtener correlativas del mapa (ya convertidas a IDs)
        const correlativas = correlativasPorId.get(m.id) || { reqsRegularizadas: [], reqsAprobadas: [] };

        const { reqsRegularizadas, reqsAprobadas } = correlativas;

        // Todas las correlativas únicas (para compatibilidad y conexiones visuales)
        const allReqs = [...new Set([...reqsRegularizadas, ...reqsAprobadas])];

        // Obtener estado del usuario
        const estadoApi = estadosPorMateriaId.get(m.id) || null;
        const estadoVisual = apiToVisual(estadoApi as any);

        return {
          id: m.id,
          numero: m.numero,
          nombre: m.nombre || `Materia ${m.numero}`,
          nivel,
          col: col >= 0 ? col : 0,
          reqs: allReqs,
          reqsRegularizadas,
          reqsAprobadas,
          estado: estadoVisual,
        };
      });

      // 8. Recalcular cascada y stats
      const conCascada = recalcularCascada(materiasSimulador);
      setMaterias(conCascada);
      setStats(calcularStats(conCascada));

    } catch (e) {
      console.error('Error cargando datos del simulador:', e);
      setError('Error al cargar el plan de estudios');
    } finally {
      setLoading(false);
    }
  }, [user?.id, recalcularCascada, calcularStats]);

  /**
   * Actualiza el estado de una materia (optimistic update + sync con API)
   */
  const updateMateriaEstado = useCallback(async (materiaId: number, nuevoEstado: EstadoVisual) => {
    // Optimistic update
    const nuevasMaterias = materias.map(m =>
      m.id === materiaId ? { ...m, estado: nuevoEstado } : m
    );
    const conCascada = recalcularCascada(nuevasMaterias);
    setMaterias(conCascada);
    setStats(calcularStats(conCascada));

    // Sincronizar con API si esta logueado
    if (user?.id) {
      try {
        const estadoApi = nuevoEstado === 'aprobada' ? 'aprobado' :
          nuevoEstado === 'regularizada' ? 'regular' :
            nuevoEstado === 'pendiente' ? 'cursado' : 'no_cursado';

        // Intentar actualizar primero
        try {
          await materiasApi.updateEstadoMateria(user.id, materiaId, estadoApi);
        } catch (updateError: any) {
          const status = updateError?.response?.status;
          if (status === 404) {
            // La materia no esta agregada al usuario, agregarla
            try {
              await materiasApi.addMateriaToUsuario(user.id, materiaId, estadoApi);
            } catch (addError: any) {
              // Si da 400 significa que ya existe, intentar actualizar de nuevo
              if (addError?.response?.status === 400) {
                await materiasApi.updateEstadoMateria(user.id, materiaId, estadoApi);
              }
            }
          } else if (status !== 400) {
            // Solo loguear si no es error de "ya existe"
            throw updateError;
          }
        }
      } catch (e) {
        console.error('Error sincronizando estado:', e);
        // No revertir para mantener la experiencia fluida
      }
    }
  }, [materias, user?.id, recalcularCascada, calcularStats]);

  // Cargar datos al montar
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    materias,
    stats,
    loading,
    error,
    isLoggedIn,
    refetch: loadData,
    updateMateriaEstado,
  };
}
