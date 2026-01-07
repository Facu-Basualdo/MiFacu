import { Router } from "express";
import { finalesController } from "../controllers/finales.controller";
import { validateFinal } from "../middleware/validation.middleware";

const router = Router();

router.get("/", finalesController.getFinales);
router.get("/:id", finalesController.getFinal);
router.post("/", validateFinal, finalesController.createFinal);
router.put("/:id", validateFinal, finalesController.updateFinal);
router.delete("/:id", finalesController.deleteFinal);

export default router;
