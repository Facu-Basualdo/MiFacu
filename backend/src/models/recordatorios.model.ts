import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { TipoRecordatorio } from '../types/recordatorios';
import { Materia } from './materias.model';
import { User } from './user.model';

@Entity('recordatorios')
export class Recordatorio {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'nombre', type: 'varchar', length: 100 })
    nombre!: string;

    @Column({ name: 'materia_id', type: 'int', nullable: true })
    materiaId!: number | null;

    @Column({ name: 'tipo', type: 'enum', enum: TipoRecordatorio })
    tipo!: TipoRecordatorio;

    @Column({ name: 'fecha', type: 'date', nullable: true })
    fecha!: Date | null;

    @Column({ name: 'hora', type: 'time', nullable: true })
    hora!: string | null;

    @Column({ name: 'color', type: 'varchar', length: 100, nullable: true })
    color!: string | null;

    @Column({ name: 'descripcion', type: 'text', nullable: true })
    descripcion!: string | null;

    @Column({ name: 'notificado', type: 'boolean', default: false })
    notificado!: boolean;

    @ManyToOne(() => Materia, (materia) => materia.recordatorios, { nullable: true })
    @JoinColumn({ name: "materia_id" })
    materia!: Materia | null;

    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    userId!: string;

    @ManyToOne(() => User, user => user.recordatorios)
    @JoinColumn({ name: "user_id" })
    user!: User;
}

