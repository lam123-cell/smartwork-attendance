import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import {
  getSystemSettingsController,
  updateSystemSettingsController,
  listShiftsController,
  createShiftController,
  updateShiftController,
  deleteShiftController,
} from '../controllers/systemSettingsController';

const router = Router();

router.get('/settings', requireAuth, getSystemSettingsController);
router.put('/settings', requireAuth, updateSystemSettingsController);

router.get('/shifts', requireAuth, listShiftsController);
router.post('/shifts', requireAuth, createShiftController);
router.put('/shifts/:id', requireAuth, updateShiftController);
router.delete('/shifts/:id', requireAuth, deleteShiftController);

export default router;
