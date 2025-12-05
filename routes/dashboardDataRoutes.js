import express from 'express';
import { getDashboardData, getWeeklyAttendance } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/', getDashboardData);

router.get('/attendance/archive/weekly', getWeeklyAttendance);
export default router;