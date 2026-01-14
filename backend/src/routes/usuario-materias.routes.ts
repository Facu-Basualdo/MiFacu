import { Router } from "express";
import { usuarioMateriasController } from "../controllers/usuario-materias.controller";

const router = Router();

// Rutas para gestionar las materias de un usuario específico
router.get("/:usuarioId", usuarioMateriasController.getMateriasByUsuario);
router.post("/:usuarioId", usuarioMateriasController.addMateriaToUsuario);
router.put("/:usuarioId/:materiaId", usuarioMateriasController.updateEstadoMateria);
router.delete("/:usuarioId/:materiaId", usuarioMateriasController.removeMateriaFromUsuario);

// Ruta para obtener materias disponibles (no agregadas por el usuario)
router.get("/:usuarioId/disponibles", usuarioMateriasController.getMateriasDisponibles);

export default router;
