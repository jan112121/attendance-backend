import express from 'express';
import { getStudentDashboard } from '../controllers/studentController.js';

const router = express.Router();

// GET /api/students/:id/dashboard
router.get('/me', getStudentDashboard); 

export default router;