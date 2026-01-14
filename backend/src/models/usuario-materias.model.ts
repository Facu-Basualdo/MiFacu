import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Materia } from "./materias.model";
import { EstadoMateriaUsuario } from '../types/materias';

@Entity('usuario_materias')
export class UsuarioMateria {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'usuario_id', type: 'varchar', length: 255 })
    usuarioId!: string; // ID del usuario (puede ser email, UUID, etc.)

    @Column({ name: 'materia_id', type: 'int' })
    materiaId!: number;

    @ManyToOne(() => Materia)
    @JoinColumn({ name: 'materia_id' })
    materia!: Materia;

    @Column({
        name: 'estado',
        type: 'enum',
        enum: EstadoMateriaUsuario,
        default: EstadoMateriaUsuario.NoCursado
    })
    estado!: EstadoMateriaUsuario;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
