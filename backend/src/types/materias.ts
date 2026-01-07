export enum Duración {
    Anual = 'Anual',
    Cuatrimestral1 = 'Primer Cuatrimestre',
    Cuatrimestral2 = 'Segundo Cuatrimestre',
}

// Interfaces 
export interface IMateria {
    id: number;
    anio: number;
    nombre: string;
    duracion: Duración;
}