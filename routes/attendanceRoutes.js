import express from 'express';
import { getAllAttendance, verifyAttendance } from '../controllers/attendanceController.js';
import AttendanceArchive from '../models/attendanceArchive.js';
import Attendance from '../models/attendance.js';
import User from '../models/users.js';
import moment from 'moment-timezone';
import Grade from '../models/Levels/grades.model.js';
import Penalties from '../models/penalties.js';
import MasterList from '../models/masterList.js';

const router = express.Router();
const getPhilippineDate = () => moment().tz('Asia/Manila').format('YYYY-MM-DD');

// POST /api/attendance/verify
router.post('/verify', verifyAttendance);

router.get('/all', getAllAttendance);

// GET /api/attendance/today
router.get('/today', async (_req, res) => {
  try {
    const today = getPhilippineDate();
    const records = await Attendance.findAll({
      include: [
        {
          model: User,
          attributes: ['first_name', 'last_name', 'student_number', 'section', 'grade_id'],
          include: [
            { model: Grade, attributes: ['grade_name'] },
            {model: MasterList, as: 'master', attributes: ['section', 'grade_level', 'room_number']},  
            { model: Penalties, attributes: ['reason', 'amount', 'status', 'created_at'] },
          ],
        },
      ],
      where: { date: today },
      order: [['time', 'ASC']], // optional: sort by time
    });
    res.json(records);
  } catch (err) {
    console.error('Error fetching today attendance:', err);
    res.status(500).json({ error: 'Failed to fetch today attendance' });
  }
});

// GET /api/attendance/yesterday
router.get('/yesterday', async (_req, res) => {
  try {
    const yesterday = moment().tz('Asia/Manila').subtract(1, 'day').format('YYYY-MM-DD');
    const records = await AttendanceArchive.findAll({
      include: [
        {
          model: User,
          attributes: ['first_name', 'last_name', 'student_number', 'section', 'grade_id'],
          include: [
            { model: Grade, attributes: ['grade_name'] },
            {model: MasterList, as: 'master', attributes: ['section', 'grade_level', 'room_number']},  
            { model: Penalties, attributes: ['reason', 'amount', 'status', 'created_at'] },
          ],
        },
      ],
      where: { date: yesterday },
      order: [['time', 'ASC']], // optional: sort by time
    });
    res.json(records);
  } catch (err) {
    console.error('Error fetching yesterday attendance:', err);
    res.status(500).json({ error: 'Failed to fetch yesterday attendance' });
  }
});

export default router;
