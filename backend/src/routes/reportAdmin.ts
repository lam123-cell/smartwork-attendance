import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import {
  getAttendanceRatioController,
  getDetailedReportController,
  exportReportExcelController,
  exportReportPdfController,
  getHoursByDepartmentController,
  getReportFilters,
  getReportStatsController,
} from '../controllers/adminReportController';

const router = Router();

router.get('/filters', requireAuth, getReportFilters);
router.get('/stats', requireAuth, getReportStatsController);
router.get('/hours-by-department', requireAuth, getHoursByDepartmentController);
router.get('/attendance-ratio', requireAuth, getAttendanceRatioController);
router.get('/detailed', requireAuth, getDetailedReportController);
router.get('/export/excel', requireAuth, exportReportExcelController);
router.get('/export/pdf', requireAuth, exportReportPdfController);

export default router;
