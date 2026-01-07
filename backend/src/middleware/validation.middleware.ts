import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.middleware';

export const validateRecordatorio = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { nombre, materiaNombre, tipo, fecha, hora, color } = req.body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
        return next(new AppError('El nombre es requerido', 400));
    }

    if (!materiaNombre || typeof materiaNombre !== 'string' || materiaNombre.trim().length === 0) {
        return next(new AppError('El nombre de la materia es requerido', 400));
    }

    if (!tipo || !['Parcial', 'Entrega'].includes(tipo)) {
        return next(new AppError('El tipo debe ser "Parcial" o "Entrega"', 400));
    }

    if (!fecha) {
        return next(new AppError('La fecha es requerida', 400));
    }

    // Validar formato de fecha (YYYY-MM-DD)
    if (typeof fecha === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return next(new AppError('La fecha debe tener el formato YYYY-MM-DD', 400));
    }

    if (!hora) {
        return next(new AppError('La hora es requerida', 400));
    }

    // Validar formato de hora (HH:MM o HH:MM:SS)
    if (typeof hora === 'string' && !/^\d{2}:\d{2}(:\d{2})?$/.test(hora)) {
        return next(new AppError('La hora debe tener el formato HH:MM o HH:MM:SS', 400));
    }

    if (!color || typeof color !== 'string') {
        return next(new AppError('El color es requerido', 400));
    }

    next();
};

export const validateFinal = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { materiaNombre, fecha, hora, color } = req.body;

    if (!materiaNombre || typeof materiaNombre !== 'string' || materiaNombre.trim().length === 0) {
        return next(new AppError('El nombre de la materia es requerido', 400));
    }

    if (!fecha) {
        return next(new AppError('La fecha es requerida', 400));
    }

    if (!hora) {
        return next(new AppError('La hora es requerida', 400));
    }

    if (!color || typeof color !== 'string') {
        return next(new AppError('El color es requerido', 400));
    }

    next();
};
