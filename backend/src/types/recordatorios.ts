export enum TipoRecordatorio {
    Parcial = 'Parcial',
    Entrega = 'Entrega',
}

export interface IRecordatorio {
    id: number;
    nombre: string;
    materiaId: number;
    tipo: TipoRecordatorio;
    fecha: Date;
    hora: string;
    color: string;
    notificado: boolean;
}