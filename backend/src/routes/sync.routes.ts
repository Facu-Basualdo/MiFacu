import { Router } from 'express';
import { syncData } from '../controllers/sync.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateUser, syncData);

export default router;
