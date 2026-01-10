import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn } from "typeorm";
import { Recordatorio } from "./recordatorios.model";
import { Final } from "./finales.model";

@Entity('users')
export class User {
    @PrimaryColumn('uuid')
    id!: string; // Supabase User ID

    @Column({ type: 'varchar', length: 255, nullable: true })
    email!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    nombre!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @OneToMany(() => Recordatorio, recordatorio => recordatorio.user)
    recordatorios!: Recordatorio[];

    @OneToMany(() => Final, final => final.user)
    finales!: Final[];
}
