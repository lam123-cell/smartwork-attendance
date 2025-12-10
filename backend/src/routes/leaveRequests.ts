import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import {
  submitLeaveRequest,
  getMyLeaveRequests,
  listAllLeaveRequests,
  approveLeave,
  rejectLeave,
  getLeaveTypesList,
} from '../controllers/leaveRequestController';

const router = Router();

// Nhân viên endpoints
router.post('/', requireAuth, submitLeaveRequest); // Tạo đơn xin phép
router.get('/my-requests', requireAuth, getMyLeaveRequests); // Xem danh sách đơn của mình
router.get('/types', requireAuth, getLeaveTypesList); // Lấy danh sách loại phép

// Admin endpoints
router.get('/all', requireAuth, listAllLeaveRequests); // Danh sách tất cả đơn
router.post('/:id/approve', requireAuth, approveLeave); // Duyệt đơn
router.post('/:id/reject', requireAuth, rejectLeave); // Từ chối đơn

export default router;
