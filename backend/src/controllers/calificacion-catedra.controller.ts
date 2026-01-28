import { Request, Response } from "express";
import { CalificacionCatedraService } from "../services/calificacion-catedra.service";
import { asyncHandler } from "../middleware/errorHandler.middleware";

export class CalificacionCatedraController {
    private service: CalificacionCatedraService;

    constructor() {
        this.service = new CalificacionCatedraService();
    }

    getAll = asyncHandler(async (req: Request, res: Response) => {
        const materiaId = req.query.materiaId ? parseInt(req.query.materiaId as string) : undefined;
        const calificaciones = await this.service.getAll(materiaId);

        // Obtener votos del usuario actual para cada calificación
        const userId = req.user.id;
        const calificacionIds = calificaciones.map(c => c.id);
        const votosUsuario = calificacionIds.length > 0
            ? await this.service.getVotosUsuario(calificacionIds, userId)
            : {};

        // Agregar info del voto del usuario a cada calificación
        const calificacionesConVoto = calificaciones.map(c => ({
            ...c,
            miVoto: votosUsuario[c.id] ?? null,
            // Ocultar userId y user si es anónimo (solo mostrar verificado badge)
            esVerificado: !c.esAnonimo,
            user: c.esAnonimo ? null : c.user,
        }));

        res.status(200).json({
            status: 'success',
            data: calificacionesConVoto,
        });
    });

    getById = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const calificacion = await this.service.getById(parseInt(id));

        const userId = req.user.id;
        const miVoto = await this.service.getVotoUsuario(parseInt(id), userId);

        res.status(200).json({
            status: 'success',
            data: {
                ...calificacion,
                miVoto,
                esVerificado: !calificacion.esAnonimo,
                user: calificacion.esAnonimo ? null : calificacion.user,
            },
        });
    });

    create = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user.id;
        const calificacion = await this.service.create(req.body, userId);

        res.status(201).json({
            status: 'success',
            data: calificacion,
        });
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const userId = req.user.id;
        const calificacion = await this.service.update(parseInt(id), req.body, userId);

        res.status(200).json({
            status: 'success',
            data: calificacion,
        });
    });

    delete = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const userId = req.user.id;
        await this.service.delete(parseInt(id), userId);

        res.status(204).send();
    });

    votar = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { tipo } = req.body;
        const userId = req.user.id;

        const calificacion = await this.service.votar(parseInt(id), tipo, userId);

        const miVoto = await this.service.getVotoUsuario(parseInt(id), userId);

        res.status(200).json({
            status: 'success',
            data: {
                ...calificacion,
                miVoto,
            },
        });
    });

    reportar = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { motivo } = req.body;
        const userId = req.user.id;

        const calificacion = await this.service.reportar(parseInt(id), motivo, userId);

        res.status(200).json({
            status: 'success',
            data: calificacion,
            message: 'Reporte enviado correctamente',
        });
    });

    getPromedioMateria = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const resultado = await this.service.getPromedioMateria(parseInt(id));

        res.status(200).json({
            status: 'success',
            data: resultado,
        });
    });

    getProfesoresSugeridos = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const profesores = await this.service.getProfesoresSugeridos(parseInt(id));

        res.status(200).json({
            status: 'success',
            data: profesores,
        });
    });
}

export const calificacionCatedraController = new CalificacionCatedraController();
