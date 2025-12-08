import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { getAllAttendanceAdmin, searchAttendanceRecords, exportAllAttendanceExcel, updateAttendance } from '../controllers/attendanceAdminController';

const router = Router();

// Admin endpoints for attendance management
router.get('/all', requireAuth, getAllAttendanceAdmin);
router.get('/search', requireAuth, searchAttendanceRecords);
router.get('/export', requireAuth, exportAllAttendanceExcel);
router.put('/:id', requireAuth, updateAttendance);

export default router;
