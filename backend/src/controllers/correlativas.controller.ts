import { Request, Response, NextFunction } from 'express';
import { CorrelativasService } from '../services/correlativas.service';

const correlativasService = new CorrelativasService();

/**
 * GET /api/correlativas
 * Obtiene todas las correlativas agrupadas por materia
 */
export const getAllCorrelativas = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const correlativas = await correlativasService.getAllCorrelativas();
    res.json(correlativas);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/correlativas/:materiaId
 * Obtiene las correlativas de una materia específica
 */
export const getCorrelativasByMateria = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { materiaId } = req.params;
    const correlativas = await correlativasService.getCorrelativasByMateria(Number(materiaId));
    res.json(correlativas);
  } catch (error) {
    next(error);
  }
};
