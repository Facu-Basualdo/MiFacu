import { Repository } from 'typeorm';
import { AppDataSource } from '../config/DataSource';
import { CorrelativaDetalle, TipoCorrelativa } from '../models/correlativas.model';
import { Materia } from '../models/materias.model';

export interface CorrelativaResponse {
  materiaId: number;
  reqsRegularizadas: number[];  // IDs de materias que necesitan estar regularizadas
  reqsAprobadas: number[];      // IDs de materias que necesitan estar aprobadas
}

export class CorrelativasService {
  private correlativaRepo: Repository<CorrelativaDetalle>;
  private materiaRepo: Repository<Materia>;

  constructor() {
    this.correlativaRepo = AppDataSource.getRepository(CorrelativaDetalle);
    this.materiaRepo = AppDataSource.getRepository(Materia);
  }

  /**
   * Obtiene todas las correlativas agrupadas por materia
   */
  async getAllCorrelativas(): Promise<CorrelativaResponse[]> {
    const correlativas = await this.correlativaRepo.find({
      relations: ['materia', 'correlativa'],
    });

    // Agrupar por materia
    const porMateria = new Map<number, CorrelativaResponse>();

    correlativas.forEach(c => {
      if (!porMateria.has(c.materiaId)) {
        porMateria.set(c.materiaId, {
          materiaId: c.materiaId,
          reqsRegularizadas: [],
          reqsAprobadas: [],
        });
      }

      const entry = porMateria.get(c.materiaId)!;
      if (c.tipo === TipoCorrelativa.Regularizada) {
        entry.reqsRegularizadas.push(c.correlativaId);
      } else {
        entry.reqsAprobadas.push(c.correlativaId);
      }
    });

    return Array.from(porMateria.values());
  }

  /**
   * Obtiene las correlativas de una materia específica
   */
  async getCorrelativasByMateria(materiaId: number): Promise<CorrelativaResponse> {
    const correlativas = await this.correlativaRepo.find({
      where: { materiaId },
      relations: ['correlativa'],
    });

    const response: CorrelativaResponse = {
      materiaId,
      reqsRegularizadas: [],
      reqsAprobadas: [],
    };

    correlativas.forEach(c => {
      if (c.tipo === TipoCorrelativa.Regularizada) {
        response.reqsRegularizadas.push(c.correlativaId);
      } else {
        response.reqsAprobadas.push(c.correlativaId);
      }
    });

    return response;
  }

  /**
   * Agrega una correlativa
   */
  async addCorrelativa(
    materiaId: number,
    correlativaId: number,
    tipo: TipoCorrelativa
  ): Promise<CorrelativaDetalle> {
    const correlativa = this.correlativaRepo.create({
      materiaId,
      correlativaId,
      tipo,
    });
    return await this.correlativaRepo.save(correlativa);
  }

  /**
   * Elimina todas las correlativas de una materia
   */
  async clearCorrelativas(materiaId: number): Promise<void> {
    await this.correlativaRepo.delete({ materiaId });
  }

  /**
   * Elimina todas las correlativas
   */
  async clearAll(): Promise<void> {
    await this.correlativaRepo.clear();
  }
}
