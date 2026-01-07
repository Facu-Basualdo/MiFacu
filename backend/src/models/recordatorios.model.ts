import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { TipoRecordatorio } from '../types/recordatorios';
import { Materia } from './materias.model';

@Entity('recordatorios')
export class Recordatorio {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'nombre', type: 'varchar', length: 100 })
    nombre!: string;

    @Column({ name: 'materia_id', type: 'int' })
    materiaId!: number;

    @Column({ name: 'tipo', type: 'enum', enum: TipoRecordatorio })
    tipo!: TipoRecordatorio;

    @Column({ name: 'fecha', type: 'date' })
    fecha!: Date;

    @Column({ name: 'hora', type: 'time' })
    hora!: string;

    @Column({ name: 'color', type: 'varchar', length: 100 })
    color!: string;

    @Column({ name: 'notificado', type: 'boolean', default: false })
    notificado!: boolean;

    @ManyToOne(() => Materia, (materia) => materia.recordatorios)
    @JoinColumn({ name: "materia_id" })
    materia!: Materia;
}

