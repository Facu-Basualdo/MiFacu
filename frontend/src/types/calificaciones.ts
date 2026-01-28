export enum Dificultad {
    Facil = 'facil',
    Media = 'media',
    Dificil = 'dificil',
}

export enum TipoVoto {
    Util = 'util',
    NoUtil = 'no_util',
}

export interface CalificacionCatedra {
    id: number;
    materiaId: number;
    materia: {
        id: number;
        nombre: string;
        numero?: number;
    };
    profesorNombre: string;
    rating: number;
    dificultad: Dificultad;
    comentario: string;
    esAnonimo: boolean;
    userId: string;
    user: {
        id: string;
        email?: string;
    } | null;
    esVerificado: boolean;
    votosUtiles: number;
    votosNoUtiles: number;
    reportes: number;
    miVoto: TipoVoto | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCalificacionDTO {
    materiaId: number;
    profesorNombre: string;
    rating: number;
    dificultad: Dificultad;
    comentario: string;
    esAnonimo?: boolean;
}

export interface UpdateCalificacionDTO {
    profesorNombre?: string;
    rating?: number;
    dificultad?: Dificultad;
    comentario?: string;
    esAnonimo?: boolean;
}

export interface PromedioMateria {
    promedio: number;
    total: number;
}

export const DIFICULTAD_LABELS: Record<Dificultad, string> = {
    [Dificultad.Facil]: 'Facil',
    [Dificultad.Media]: 'Media',
    [Dificultad.Dificil]: 'Dificil',
};

export const DIFICULTAD_COLORS: Record<Dificultad, string> = {
    [Dificultad.Facil]: '#34C759',
    [Dificultad.Media]: '#FF9500',
    [Dificultad.Dificil]: '#FF3B30',
};

export const MOTIVOS_REPORTE = [
    'Contenido inapropiado u ofensivo',
    'Informacion falsa o enganosa',
    'Spam o publicidad',
    'Acoso o discriminacion',
    'Otro motivo',
];
