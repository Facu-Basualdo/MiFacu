import { Repository } from 'typeorm';
import { AppDataSource } from '../config/DataSource';
import { Recordatorio } from '../models/recordatorios.model';
import { MateriasService } from './materias.service';
import { AppError } from '../middleware/errorHandler.middleware';
import { TipoRecordatorio } from '../types/recordatorios';

export class RecordatoriosService {
    private recordatorioRepository: Repository<Recordatorio>;
    private materiasService: MateriasService;

    constructor() {
        this.recordatorioRepository = AppDataSource.getRepository(Recordatorio);
        this.materiasService = new MateriasService();
    }

    async getAllRecordatorios(): Promise<Recordatorio[]> {
        return await this.recordatorioRepository.find({
            relations: ['materia'],
        });
    }

    async getRecordatorioById(id: number): Promise<Recordatorio> {
        const recordatorio = await this.recordatorioRepository.findOne({
            where: { id },
            relations: ['materia'],
        });

        if (!recordatorio) {
            throw new AppError('Recordatorio no encontrado', 404);
        }

        return recordatorio;
    }

    async createRecordatorio(data: {
        nombre: string;
        materiaNombre: string;
        tipo: TipoRecordatorio;
        fecha: Date | string;
        hora: string;
        color: string;
    }): Promise<Recordatorio> {
        const { nombre, materiaNombre, tipo, fecha, hora, color } = data;

        const materia = await this.materiasService.findOrCreateMateria(materiaNombre);

        // Convertir fecha string a Date si es necesario
        const fechaDate = typeof fecha === 'string' ? new Date(fecha) : fecha;

        const recordatorio = this.recordatorioRepository.create({
            nombre,
            materiaId: materia.id,
            tipo,
            fecha: fechaDate,
            hora,
            color,
            notificado: false,
            materia,
        });

        return await this.recordatorioRepository.save(recordatorio);
    }

    async deleteRecordatorio(id: number): Promise<void> {
        const recordatorio = await this.getRecordatorioById(id);
        await this.recordatorioRepository.remove(recordatorio);
    }

    async updateRecordatorio(
        id: number,
        data: Partial<{
            nombre: string;
            tipo: TipoRecordatorio;
            fecha: Date;
            hora: string;
            color: string;
            notificado: boolean;
        }>
    ): Promise<Recordatorio> {
        const recordatorio = await this.getRecordatorioById(id);

        Object.assign(recordatorio, data);

        return await this.recordatorioRepository.save(recordatorio);
    }
}
