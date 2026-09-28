import express from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', getDepartments); // public: registration needs it before login

router.post('/', protect, requireRole('admin'), createDepartment);
router.put('/:id', protect, requireRole('admin'), updateDepartment);
router.delete('/:id', protect, requireRole('admin'), deleteDepartment);

export default router;