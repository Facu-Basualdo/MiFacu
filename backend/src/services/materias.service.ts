import { Repository } from 'typeorm';
import { AppDataSource } from '../config/DataSource';
import { Materia } from '../models/materias.model';
import { Duración } from '../types/materias';
import { AppError } from '../middleware/errorHandler.middleware';

export class MateriasService {
    private materiaRepository: Repository<Materia>;

    constructor() {
        this.materiaRepository = AppDataSource.getRepository(Materia);
    }

    async findOrCreateMateria(
        nombre: string,
        nivel: string = "I",
        duracion: Duración = Duración.Anual
    ): Promise<Materia> {
        let materia = await this.materiaRepository.findOne({
            where: { nombre },
        });

        if (!materia) {
            materia = this.materiaRepository.create({
                nombre,
                nivel,
                duracion,
            });
            materia = await this.materiaRepository.save(materia);
        }

        return materia;
    }

    async getMateriaById(id: number): Promise<Materia> {
        const materia = await this.materiaRepository.findOne({
            where: { id },
        });

        if (!materia) {
            throw new AppError('Materia no encontrada', 404);
        }

        return materia;
    }

    async getAllMaterias(): Promise<Materia[]> {
        return await this.materiaRepository.find({
            relations: ['recordatorios', 'finales'],
        });
    }
}
