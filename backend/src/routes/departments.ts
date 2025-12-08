import { Router, Request, Response, NextFunction } from 'express';
import { getAllDepartments } from '../repositories/departmentRepository';

const router = Router();

// GET /api/departments
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await getAllDepartments();
    return res.json({ items });
  } catch (err) {
    next(err);
  }
});

export default router;
