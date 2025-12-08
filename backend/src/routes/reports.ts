import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { getPersonalReport, exportPersonalReport } from '../controllers/reportController';

const router = Router();

router.get('/personal', requireAuth, getPersonalReport);
router.get('/personal/export', requireAuth, exportPersonalReport);

export default router;
