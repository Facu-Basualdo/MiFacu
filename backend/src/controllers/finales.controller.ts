import { Request, Response } from "express";
import { FinalesService } from "../services/finales.service";
import { asyncHandler } from "../middleware/errorHandler.middleware";

export class FinalesController {
    private finalesService: FinalesService;

    constructor() {
        this.finalesService = new FinalesService();
    }

    getFinales = asyncHandler(async (req: Request, res: Response) => {
        const finales = await this.finalesService.getAllFinales();
        res.status(200).json({
            status: 'success',
            data: finales,
        });
    });

    getFinal = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const final = await this.finalesService.getFinalById(parseInt(id));
        res.status(200).json({
            status: 'success',
            data: final,
        });
    });

    createFinal = asyncHandler(async (req: Request, res: Response) => {
        const final = await this.finalesService.createFinal(req.body);
        res.status(201).json({
            status: 'success',
            data: final,
        });
    });

    updateFinal = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const final = await this.finalesService.updateFinal(parseInt(id), req.body);
        res.status(200).json({
            status: 'success',
            data: final,
        });
    });

    deleteFinal = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        await this.finalesService.deleteFinal(parseInt(id));
        res.status(204).send();
    });
}

// Exportar instancia para usar en rutas
export const finalesController = new FinalesController();
