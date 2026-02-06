export enum Duración {
    Anual = 'Anual',
    Cuatrimestral = 'Cuatrimestral',
    Trimestral = 'Trimestral',
}

export enum EstadoMateriaUsuario {
    NoCursado = 'no_cursado',
    Cursado = 'cursado',
    Regular = 'regular',
    Aprobado = 'aprobado',
}

// Interfaces 
export interface IMateria {
    id: number;
    anio: number;
    nombre: string;
    duracion: Duración;
}