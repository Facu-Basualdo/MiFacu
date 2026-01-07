import { Repository } from 'typeorm';
import { AppDataSource } from '../config/DataSource';
import { Final } from '../models/finales.model';
import { MateriasService } from './materias.service';
import { AppError } from '../middleware/errorHandler.middleware';

export class FinalesService {
    private finalRepository: Repository<Final>;
    private materiasService: MateriasService;

    constructor() {
        this.finalRepository = AppDataSource.getRepository(Final);
        this.materiasService = new MateriasService();
    }

    async getAllFinales(): Promise<Final[]> {
        return await this.finalRepository.find({
            relations: ['materia'],
        });
    }

    async getFinalById(id: number): Promise<Final> {
        const final = await this.finalRepository.findOne({
            where: { id },
            relations: ['materia'],
        });

        if (!final) {
            throw new AppError('Final no encontrado', 404);
        }

        return final;
    }

    async createFinal(data: {
        materiaNombre: string;
        fecha: Date;
        hora: string;
        color: string;
    }): Promise<Final> {
        const { materiaNombre, fecha, hora, color } = data;

        const materia = await this.materiasService.findOrCreateMateria(materiaNombre);

        const final = this.finalRepository.create({
            materiaId: materia.id,
            fecha,
            hora,
            color,
            notificado: false,
            materia,
        });

        return await this.finalRepository.save(final);
    }

    async deleteFinal(id: number): Promise<void> {
        const final = await this.getFinalById(id);
        await this.finalRepository.remove(final);
    }

    async updateFinal(
        id: number,
        data: Partial<{
            fecha: Date;
            hora: string;
            color: string;
            notificado: boolean;
        }>
    ): Promise<Final> {
        const final = await this.getFinalById(id);

        Object.assign(final, data);

        return await this.finalRepository.save(final);
    }
}
