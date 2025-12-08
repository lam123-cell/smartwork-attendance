import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth';
import { getEmployees, getEmployeeStats, createEmployee, updateEmployee, toggleEmployeeStatus, deleteEmployee} from '../controllers/employeeController';

const router = Router();

// All routes require admin authentication
router.use(requireAuth);
router.use(requireRole(['admin']));

router.get('/', getEmployees);
router.get('/stats', getEmployeeStats);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.patch('/:id/toggle-status', toggleEmployeeStatus);
router.delete('/:id', deleteEmployee);

export default router;
