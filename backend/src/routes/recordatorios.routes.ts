import { Router } from "express";
import { recordatoriosController } from "../controllers/recordatorios.controller";
import { validateRecordatorio } from "../middleware/validation.middleware";

const router = Router();

router.get("/", recordatoriosController.getRecordatorios);
router.get("/:id", recordatoriosController.getRecordatorio);
router.post("/", validateRecordatorio, recordatoriosController.createRecordatorio);
router.put("/:id", validateRecordatorio, recordatoriosController.updateRecordatorio);
router.delete("/:id", recordatoriosController.deleteRecordatorio);

export default router;
