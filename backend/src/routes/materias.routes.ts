import { Router } from "express";
import { materiasController } from "../controllers/materias.controller";

const router = Router();

router.get("/", materiasController.getMaterias);
router.get("/:id", materiasController.getMateria);

export default router;
