import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { Recordatorio } from "./recordatorios.model";
import { Final } from "./finales.model";
import { Duración } from '../types/materias';

@Entity('materias')
export class Materia {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'numero', type: 'int', unique: true, nullable: true })
    numero!: number; // Corresponde al N° del PDF (1-36)

    @Column({ name: 'nivel', type: 'varchar', length: 10, nullable: true })
    nivel!: string; // I, II, III, IV, V

    @Column({ name: 'nombre', type: 'varchar', length: 150, unique: true })
    nombre!: string;

    @Column({ name: 'duración', type: 'enum', enum: Duración, nullable: true })
    duracion!: Duración;

    @OneToMany(() => Recordatorio, (recordatorio) => recordatorio.materia)
    recordatorios!: Recordatorio[];

    @OneToMany(() => Final, (final) => final.materia)
    finales!: Final[];

    // Relación para correlativas (Materias que debo tener para cursar esta)
    @ManyToMany(() => Materia)
    @JoinTable({
        name: 'correlativas',
        joinColumn: { name: 'materia_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'correlativa_id', referencedColumnName: 'id' }
    })
    correlativas!: Materia[];
}
