import { Router } from 'express';
import {
  getAllCorrelativas,
  getCorrelativasByMateria,
} from '../controllers/correlativas.controller';

const router = Router();

// GET /api/correlativas - Obtener todas las correlativas
router.get('/', getAllCorrelativas);

// GET /api/correlativas/:materiaId - Obtener correlativas de una materia
router.get('/:materiaId', getCorrelativasByMateria);

export default router;
