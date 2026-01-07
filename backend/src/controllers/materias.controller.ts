import { Request, Response } from "express";
import { MateriasService } from "../services/materias.service";
import { asyncHandler } from "../middleware/errorHandler.middleware";

export class MateriasController {
    private materiasService: MateriasService;

    constructor() {
        this.materiasService = new MateriasService();
    }

    getMaterias = asyncHandler(async (req: Request, res: Response) => {
        const materias = await this.materiasService.getAllMaterias();
        res.status(200).json({
            status: 'success',
            data: materias,
        });
    });

    getMateria = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const materia = await this.materiasService.getMateriaById(parseInt(id));
        res.status(200).json({
            status: 'success',
            data: materia,
        });
    });
}

// Exportar instancia para usar en rutas
export const materiasController = new MateriasController();
