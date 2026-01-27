import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Materia } from "./materias.model";

// Tipo de correlativa: regularizada o aprobada
export enum TipoCorrelativa {
  Regularizada = "regularizada",  // Solo necesita estar regularizada
  Aprobada = "aprobada"           // Necesita tener el final aprobado
}

@Entity('correlativas_detalle')
@Unique(['materia', 'correlativa', 'tipo'])
export class CorrelativaDetalle {
  @PrimaryGeneratedColumn()
  id!: number;

  // La materia que tiene este requisito
  @Column({ name: 'materia_id' })
  materiaId!: number;

  @ManyToOne(() => Materia, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'materia_id' })
  materia!: Materia;

  // La materia que es requisito (correlativa)
  @Column({ name: 'correlativa_id' })
  correlativaId!: number;

  @ManyToOne(() => Materia, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'correlativa_id' })
  correlativa!: Materia;

  // Tipo de requisito
  @Column({
    type: 'enum',
    enum: TipoCorrelativa,
    default: TipoCorrelativa.Regularizada
  })
  tipo!: TipoCorrelativa;
}
