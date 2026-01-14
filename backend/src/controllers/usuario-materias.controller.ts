import { Request, Response } from "express";
import { UsuarioMateriasService } from "../services/usuario-materias.service";
import { EstadoMateriaUsuario } from '../types/materias';
import { asyncHandler } from "../middleware/errorHandler.middleware";
import { AppError } from "../middleware/errorHandler.middleware";

export class UsuarioMateriasController {
    private usuarioMateriasService: UsuarioMateriasService;

    constructor() {
        this.usuarioMateriasService = new UsuarioMateriasService();
    }

    // Obtener todas las materias de un usuario
    getMateriasByUsuario = asyncHandler(async (req: Request, res: Response) => {
        const { usuarioId } = req.params;

        if (!usuarioId) {
            throw new AppError('usuarioId es requerido', 400);
        }

        const usuarioMaterias = await this.usuarioMateriasService.getMateriasByUsuario(usuarioId);

        res.status(200).json({
            status: 'success',
            data: usuarioMaterias,
        });
    });

    // Agregar una materia a un usuario
    addMateriaToUsuario = asyncHandler(async (req: Request, res: Response) => {
        const { usuarioId } = req.params;
        const { materiaId, estado } = req.body;

        if (!usuarioId) {
            throw new AppError('usuarioId es requerido', 400);
        }

        if (!materiaId || typeof materiaId !== 'number') {
            throw new AppError('materiaId es requerido y debe ser un número', 400);
        }

        // Validar estado si se proporciona
        if (estado && !Object.values(EstadoMateriaUsuario).includes(estado)) {
            throw new AppError('Estado inválido', 400);
        }

        const usuarioMateria = await this.usuarioMateriasService.addMateriaToUsuario(
            usuarioId,
            materiaId,
            estado || EstadoMateriaUsuario.NoCursado
        );

        res.status(201).json({
            status: 'success',
            data: usuarioMateria,
            message: 'Materia agregada exitosamente'
        });
    });

    // Actualizar estado de una materia
    updateEstadoMateria = asyncHandler(async (req: Request, res: Response) => {
        const { usuarioId, materiaId } = req.params;
        const { estado } = req.body;

        if (!usuarioId) {
            throw new AppError('usuarioId es requerido', 400);
        }

        if (!materiaId || isNaN(parseInt(materiaId))) {
            throw new AppError('materiaId es requerido y debe ser un número', 400);
        }

        if (!estado || !Object.values(EstadoMateriaUsuario).includes(estado)) {
            throw new AppError('Estado válido es requerido', 400);
        }

        const usuarioMateria = await this.usuarioMateriasService.updateEstadoMateria(
            usuarioId,
            parseInt(materiaId),
            estado
        );

        res.status(200).json({
            status: 'success',
            data: usuarioMateria,
            message: 'Estado de materia actualizado exitosamente'
        });
    });

    // Eliminar una materia del usuario
    removeMateriaFromUsuario = asyncHandler(async (req: Request, res: Response) => {
        const { usuarioId, materiaId } = req.params;

        if (!usuarioId) {
            throw new AppError('usuarioId es requerido', 400);
        }

        if (!materiaId || isNaN(parseInt(materiaId))) {
            throw new AppError('materiaId es requerido y debe ser un número', 400);
        }

        await this.usuarioMateriasService.removeMateriaFromUsuario(
            usuarioId,
            parseInt(materiaId)
        );

        res.status(200).json({
            status: 'success',
            message: 'Materia eliminada exitosamente'
        });
    });

    // Obtener materias disponibles para un usuario
    getMateriasDisponibles = asyncHandler(async (req: Request, res: Response) => {
        const { usuarioId } = req.params;

        if (!usuarioId) {
            throw new AppError('usuarioId es requerido', 400);
        }

        const materiasDisponibles = await this.usuarioMateriasService.getMateriasDisponibles(usuarioId);

        res.status(200).json({
            status: 'success',
            data: materiasDisponibles,
        });
    });
}

// Exportar instancia para usar en rutas
export const usuarioMateriasController = new UsuarioMateriasController();
