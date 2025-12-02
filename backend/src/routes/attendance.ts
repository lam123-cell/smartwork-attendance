import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { checkIn, checkOut, getStats, getToday, history, searchHistory, exportHistoryExcel } from '../controllers/attendanceController';
import { getDashboard } from '../controllers/attendanceDashboardController';

const router = Router();

// Protected endpoints for employees
router.post('/checkin', requireAuth, checkIn);
router.post('/checkout', requireAuth, checkOut);
router.get('/today', requireAuth, getToday);
router.get('/history', requireAuth, history);
router.get('/stats', requireAuth, getStats);
router.get('/dashboard', requireAuth, getDashboard);
router.get('/history/search', requireAuth, searchHistory);
router.get('/history/export', requireAuth, exportHistoryExcel);

export default router;
