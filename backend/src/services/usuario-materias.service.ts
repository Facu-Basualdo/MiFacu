import { Repository } from 'typeorm';
import { AppDataSource } from '../config/DataSource';
import { UsuarioMateria } from '../models/usuario-materias.model';
import { Materia } from '../models/materias.model';
import { EstadoMateriaUsuario } from '../types/materias';
import { AppError } from '../middleware/errorHandler.middleware';

export class UsuarioMateriasService {
    private usuarioMateriaRepository: Repository<UsuarioMateria>;
    private materiaRepository: Repository<Materia>;

    constructor() {
        this.usuarioMateriaRepository = AppDataSource.getRepository(UsuarioMateria);
        this.materiaRepository = AppDataSource.getRepository(Materia);
    }

    // Obtener todas las materias de un usuario
    async getMateriasByUsuario(usuarioId: string): Promise<UsuarioMateria[]> {
        return await this.usuarioMateriaRepository.find({
            where: { usuarioId },
            relations: ['materia'],
            order: { materia: { numero: 'ASC' } }
        });
    }

    // Agregar una materia a un usuario
    async addMateriaToUsuario(
        usuarioId: string,
        materiaId: number,
        estado: EstadoMateriaUsuario = EstadoMateriaUsuario.NoCursado
    ): Promise<UsuarioMateria> {
        // Verificar que la materia existe
        const materia = await this.materiaRepository.findOne({
            where: { id: materiaId }
        });

        if (!materia) {
            throw new AppError('Materia no encontrada', 404);
        }

        // Verificar que el usuario no tenga ya esta materia
        const existingUsuarioMateria = await this.usuarioMateriaRepository.findOne({
            where: { usuarioId, materiaId }
        });

        if (existingUsuarioMateria) {
            throw new AppError('El usuario ya tiene esta materia agregada', 400);
        }

        // Crear la relación
        const usuarioMateria = this.usuarioMateriaRepository.create({
            usuarioId,
            materiaId,
            estado
        });

        return await this.usuarioMateriaRepository.save(usuarioMateria);
    }

    // Actualizar estado de una materia del usuario
    async updateEstadoMateria(
        usuarioId: string,
        materiaId: number,
        estado: EstadoMateriaUsuario
    ): Promise<UsuarioMateria> {
        const usuarioMateria = await this.usuarioMateriaRepository.findOne({
            where: { usuarioId, materiaId }
        });

        if (!usuarioMateria) {
            throw new AppError('Materia no encontrada para este usuario', 404);
        }

        usuarioMateria.estado = estado;
        return await this.usuarioMateriaRepository.save(usuarioMateria);
    }

    // Eliminar una materia del usuario
    async removeMateriaFromUsuario(usuarioId: string, materiaId: number): Promise<void> {
        const usuarioMateria = await this.usuarioMateriaRepository.findOne({
            where: { usuarioId, materiaId }
        });

        if (!usuarioMateria) {
            throw new AppError('Materia no encontrada para este usuario', 404);
        }

        await this.usuarioMateriaRepository.remove(usuarioMateria);
    }

    // Obtener materias disponibles para un usuario (todas menos las que ya tiene)
    async getMateriasDisponibles(usuarioId: string): Promise<Materia[]> {
        // Obtener IDs de materias que el usuario ya tiene
        const usuarioMaterias = await this.usuarioMateriaRepository.find({
            where: { usuarioId },
            select: ['materiaId']
        });

        const materiaIdsUsuario = usuarioMaterias.map(um => um.materiaId);

        // Obtener todas las materias que NO están en la lista del usuario
        const query = this.materiaRepository.createQueryBuilder('materia');

        if (materiaIdsUsuario.length > 0) {
            query.where('materia.id NOT IN (:...ids)', { ids: materiaIdsUsuario });
        }

        return await query.orderBy('materia.numero', 'ASC').getMany();
    }

    // Verificar si un usuario tiene una materia específica
    async usuarioTieneMateria(usuarioId: string, materiaId: number): Promise<boolean> {
        const count = await this.usuarioMateriaRepository.count({
            where: { usuarioId, materiaId }
        });
        return count > 0;
    }
}
