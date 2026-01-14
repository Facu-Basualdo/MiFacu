import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.middleware';

export const validateRecordatorio = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { nombre, tipo, fecha, hora } = req.body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
        return next(new AppError('El nombre es requerido', 400));
    }

    // Validación flexible para permitir Quick Tasks (que pueden tener tipo 'quick_task' o 'General')
    // El tipo no es estrictamente validado aquí, pero esperamos que sea coherente
    if (tipo && !['Parcial', 'Entrega', 'quick_task', 'General'].includes(tipo)) {
        // Opcional: Podríamos ser permisivos y aceptar cualquier string como tipo para futuras expansiones
        // return next(new AppError('Tipo de recordatorio no válido', 400));
    }

    // Fecha y Hora ahora son opcionales para recordatorios rápidos
    // Si se proveen, validamos formato
    if (fecha && typeof fecha === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return next(new AppError('La fecha debe tener el formato YYYY-MM-DD', 400));
    }

    if (hora && typeof hora === 'string' && !/^\d{2}:\d{2}(:\d{2})?$/.test(hora)) {
        return next(new AppError('La hora debe tener el formato HH:MM o HH:MM:SS', 400));
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
