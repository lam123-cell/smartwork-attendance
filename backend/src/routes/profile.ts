import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { getProfile, updateProfile, changePassword, getActivities, uploadAvatar } from '../controllers/profileController';

const router = Router();

router.get('/', requireAuth, getProfile);
router.put('/', requireAuth, updateProfile);
router.post('/change-password', requireAuth, changePassword);
router.post('/avatar', requireAuth, uploadAvatar);
router.get('/activities', requireAuth, getActivities);

export default router;
