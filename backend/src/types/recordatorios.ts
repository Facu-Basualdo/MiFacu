export enum TipoRecordatorio {
    Parcial = 'Parcial',
    Entrega = 'Entrega',
    General = 'General',
    Kevin = 'quick_task', // Mapping 'quick_task' from frontend to a value, or just use 'quick_task' as value.
    // Let's use 'quick_task' to match frontend.
    QuickTask = 'quick_task',
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