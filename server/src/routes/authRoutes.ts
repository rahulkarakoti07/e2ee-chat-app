import { Router } from 'express';
import { getSalt, register, login, getMe } from '../controllers/authController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.get('/salt/:username', getSalt);
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateJWT, getMe);

export default router;
