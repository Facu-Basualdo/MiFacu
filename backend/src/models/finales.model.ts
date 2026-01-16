import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Materia } from "./materias.model";
import { User } from "./user.model";

@Entity('finales')
export class Final {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'materia_id', type: 'int' })
    materiaId!: number;

    @ManyToOne(() => Materia, (materia) => materia.finales)
    @JoinColumn({ name: "materia_id" })
    materia!: Materia;

    @Column({ name: 'fecha', type: 'date' })
    fecha!: Date;

    @Column({ name: 'hora', type: 'time' })
    hora!: string;

    @Column({ name: 'color', type: 'varchar', length: 100 })
    color!: string;

    @Column({ name: 'notificado', type: 'boolean', default: false })
    notificado!: boolean;

    @Column({ name: 'notificar', type: 'boolean', default: false })
    notificar!: boolean;

    @Column({ name: 'recordatorio_anticipacion', type: 'int', default: 0 })
    recordatorioAnticipacion!: number;

    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    userId!: string;

    @ManyToOne(() => User, user => user.finales)
    @JoinColumn({ name: "user_id" })
    user!: User;
}
