import { Request, Response } from "express";
import { RecordatoriosService } from "../services/recordatorios.service";
import { asyncHandler } from "../middleware/errorHandler.middleware";

export class RecordatoriosController {
    private recordatoriosService: RecordatoriosService;

    constructor() {
        this.recordatoriosService = new RecordatoriosService();
    }

    getRecordatorios = asyncHandler(async (req: Request, res: Response) => {
        const recordatorios = await this.recordatoriosService.getAllRecordatorios();
        res.status(200).json({
            status: 'success',
            data: recordatorios,
        });
    });

    getRecordatorio = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const recordatorio = await this.recordatoriosService.getRecordatorioById(parseInt(id));
        res.status(200).json({
            status: 'success',
            data: recordatorio,
        });
    });

    createRecordatorio = asyncHandler(async (req: Request, res: Response) => {
        const recordatorio = await this.recordatoriosService.createRecordatorio(req.body);
        res.status(201).json({
            status: 'success',
            data: recordatorio,
        });
    });

    updateRecordatorio = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const recordatorio = await this.recordatoriosService.updateRecordatorio(
            parseInt(id),
            req.body
        );
        res.status(200).json({
            status: 'success',
            data: recordatorio,
        });
    });

    deleteRecordatorio = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        await this.recordatoriosService.deleteRecordatorio(parseInt(id));
        res.status(204).send();
    });
}

// Exportar instancia para usar en rutas
export const recordatoriosController = new RecordatoriosController();
