import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import {
  getDashboardStats,
  getHoursChart,
  getAttendanceChart,
  getRecentActivityData,
} from '../controllers/dashboardController';

const router = Router();

// Dashboard endpoints
router.get('/stats', requireAuth, getDashboardStats);
router.get('/hours-chart', requireAuth, getHoursChart);
router.get('/attendance-chart', requireAuth, getAttendanceChart);
router.get('/recent-activity', requireAuth, getRecentActivityData);

export default router;
