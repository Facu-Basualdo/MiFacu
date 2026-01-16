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

    async getAllFinales(userId: string): Promise<Final[]> {
        return await this.finalRepository.find({
            where: { userId },
            relations: ['materia'],
        });
    }

    async getFinalById(id: number, userId: string): Promise<Final> {
        const final = await this.finalRepository.findOne({
            where: { id, userId },
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
        notificar?: boolean;
        recordatorioAnticipacion?: number;
    }, userId: string): Promise<Final> {
        const { materiaNombre, fecha, hora, color, notificar, recordatorioAnticipacion } = data;

        const materia = await this.materiasService.findOrCreateMateria(materiaNombre);

        const final = this.finalRepository.create({
            materiaId: materia.id,
            fecha,
            hora,
            color,
            notificado: false,
            notificar: notificar || false,
            recordatorioAnticipacion: recordatorioAnticipacion || 0,
            materia,
            userId // Asignar el ID del usuario
        });

        return await this.finalRepository.save(final);
    }

    async deleteFinal(id: number, userId: string): Promise<void> {
        const final = await this.getFinalById(id, userId);
        await this.finalRepository.remove(final);
    }

    async updateFinal(
        id: number,
        data: Partial<{
            fecha: Date;
            hora: string;
            color: string;
            notificado: boolean;
            notificar: boolean;
            recordatorioAnticipacion: number;
        }>,
        userId: string
    ): Promise<Final> {
        const final = await this.getFinalById(id, userId);

        Object.assign(final, data);

        return await this.finalRepository.save(final);
    }
}
