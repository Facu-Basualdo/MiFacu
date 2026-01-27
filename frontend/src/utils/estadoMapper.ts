// Mapeo bidireccional de estados entre API y visualización del simulador

// Estados de la API del backend
export type EstadoAPI = 'aprobado' | 'regular' | 'cursado' | 'no_cursado' | null;

// Estados visuales del simulador
export type EstadoVisual = 'aprobada' | 'regularizada' | 'pendiente' | 'bloqueada';

// Colores del tema cyberpunk
export const SIMULADOR_COLORS = {
  aprobada: '#00ff9d',
  regularizada: '#FFD700',
  pendiente: '#FFFFFF',
  bloqueada: '#1a1a1a',
  fondo: '#050a10',
  lineaInactiva: '#222',
} as const;

// Configuración visual por estado
export const ESTADO_CONFIG = {
  aprobada: {
    color: SIMULADOR_COLORS.aprobada,
    bgColor: 'rgba(0, 255, 157, 0.15)',
    icon: 'checkmark-done' as const,
    iconColor: SIMULADOR_COLORS.aprobada,
    label: 'Aprobada',
  },
  regularizada: {
    color: SIMULADOR_COLORS.regularizada,
    bgColor: 'rgba(255, 215, 0, 0.1)',
    icon: 'checkmark' as const,
    iconColor: SIMULADOR_COLORS.regularizada,
    label: 'Regularizada',
  },
  pendiente: {
    color: SIMULADOR_COLORS.pendiente,
    bgColor: '#222',
    icon: 'lock-open-outline' as const,
    iconColor: '#fff',
    label: 'Pendiente',
  },
  bloqueada: {
    color: '#333',
    bgColor: '#080808',
    icon: 'lock-closed' as const,
    iconColor: '#333',
    label: 'Bloqueada',
  },
} as const;

/**
 * Convierte un estado de la API al estado visual del simulador
 */
export function apiToVisual(estadoApi: EstadoAPI): EstadoVisual {
  switch (estadoApi) {
    case 'aprobado':
      return 'aprobada';
    case 'regular':
      return 'regularizada';
    case 'cursado':
      return 'pendiente';
    case 'no_cursado':
    case null:
    default:
      return 'pendiente'; // Se recalculará como bloqueada si no cumple correlativas
  }
}

/**
 * Convierte un estado visual al estado de la API
 */
export function visualToApi(estadoVisual: EstadoVisual): EstadoAPI {
  switch (estadoVisual) {
    case 'aprobada':
      return 'aprobado';
    case 'regularizada':
      return 'regular';
    case 'pendiente':
      return 'cursado';
    case 'bloqueada':
      return 'no_cursado';
    default:
      return null;
  }
}

/**
 * Obtiene el siguiente estado en el ciclo de cambio
 * pendiente -> regularizada -> aprobada -> pendiente
 */
export function getNextEstado(estadoActual: EstadoVisual): EstadoVisual {
  switch (estadoActual) {
    case 'pendiente':
      return 'regularizada';
    case 'regularizada':
      return 'aprobada';
    case 'aprobada':
      return 'pendiente';
    case 'bloqueada':
      return 'bloqueada'; // No se puede cambiar
    default:
      return 'pendiente';
  }
}

/**
 * Verifica si un estado permite desbloquear correlativas
 */
export function puedeDesbloquear(estado: EstadoVisual): boolean {
  return estado === 'aprobada' || estado === 'regularizada';
}

/**
 * Obtiene la configuración visual para un estado
 */
export function getEstadoConfig(estado: EstadoVisual) {
  return ESTADO_CONFIG[estado] || ESTADO_CONFIG.bloqueada;
}
