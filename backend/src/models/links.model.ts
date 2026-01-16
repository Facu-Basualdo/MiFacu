import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user.model";

@Entity('links')
export class Link {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 255 })
    nombre!: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    materia!: string;

    @Column({ type: 'text' })
    url!: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    color!: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;
}
