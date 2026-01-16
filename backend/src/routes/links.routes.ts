import { Router } from "express";
import { linksController } from "../controllers/links.controller";
import { authenticateUser } from "../middleware/auth.middleware";

const router = Router();

// Todas las rutas de links requieren autenticación
router.use(authenticateUser);

router.get("/", linksController.getLinks);
router.post("/", linksController.createLink);
router.put("/:id", linksController.updateLink);
router.delete("/:id", linksController.deleteLink);

export default router;
