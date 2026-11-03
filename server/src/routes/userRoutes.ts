import { Router } from 'express';
import { getUsers, getUserPublicKey, getMessages } from '../controllers/userController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', getUsers);
router.get('/:userId/keys', getUserPublicKey);
router.get('/messages/:contactId', getMessages);

export default router;
