import Attendance from '../models/attendance.js';
import User from '../models/users.js';
import Grade from '../models/Levels/grades.model.js';
import Penalties from '../models/penalties.js';
import PenaltyRules from '../models/penaltyRules.js';
import moment from 'moment-timezone';
import MasterList from '../models/masterList.js';
import EmailTemplate from '../models/emailTemplates.js';
import { sendEmailNotification } from '../utils/mailer.js';

// Helper to render templates
const renderTemplate = (templateString, data) => {
  return templateString.replace(/{{(.*?)}}/g, (match, key) => data[key.trim()] || '');
};

// Send email using template key
const sendTemplateEmail = async (templateKey, to, data) => {
  const template = await EmailTemplate.findOne({ where: { key: templateKey } });
  if (!template) return console.error(`Email template not found: ${templateKey}`);

  const subject = renderTemplate(template.subject, data);
  const body = renderTemplate(template.body, data);

  await sendEmailNotification(to, subject, body);
};
/**
 * ✅ Verify Attendance (Scanned via Aztec)
 * Handles morning/afternoon sessions, time_in/time_out, late/absent, and penalties.
 */
export const verifyAttendance = async (req, res) => {
  try {
    const { aztecData } = req.body;
    if (!aztecData)
      return res.status(400).json({ success: false, message: 'No Aztec code provided.' });

    // 🔍 Find user with grade info and master list email
    const user = await User.findOne({
      where: { aztec_code: aztecData },
      include: [
        { model: Grade, attributes: ['grade_name'] },
        { model: MasterList, as:'master', attributes: ['parent_email'] },
      ],
    });

    if (!user) return res.status(404).json({ success: false, message: 'Invalid Aztec code.' });

    const now = moment().tz('Asia/Manila');
    const date = now.format('YYYY-MM-DD');
    const time = now.format('HH:mm:ss');
    const hours = now.hour() + now.minute() / 60;

    // ⏰ Only allow scanning between 6AM and 6PM
    if (hours < 6 || hours >= 18) {
      return res.status(400).json({
        success: false,
        message: 'Scanning is allowed only between 6AM and 6PM.',
      });
    }

    // 🌞 Determine session dynamically
    let session = hours < 12 ? 'morning' : 'afternoon';

    // 🔁 Check existing attendance for today & session
    let attendance = await Attendance.findOne({ where: { user_id: user.id, date, session } });

    if (!attendance) {
      // ⏱ Time-in
      let status = 'present';

      // Optional late logic
      if ((session === 'morning' && hours >= 7) || (session === 'afternoon' && hours >= 13)) {
        status = 'late';
      }

      attendance = await Attendance.create({
        user_id: user.id,
        date,
        session,
        time,
        status,
        created_at: now.toDate(),
      });

      // 💸 Apply late penalty if applicable
      if (status === 'late') {
        const lateRule = await PenaltyRules.findOne({ where: { condition: 'late' } });
        const penaltyAmount = lateRule ? lateRule.amount : 5;

        const existingPenalty = await Penalties.findOne({
          where: { user_id: user.id, reason: 'Late Arrival', status: 'unpaid' },
        });

        if (existingPenalty) {
          existingPenalty.amount += penaltyAmount;
          await existingPenalty.save();
        } else {
          await Penalties.create({
            user_id: user.id,
            reason: 'Late Arrival',
            amount: penaltyAmount,
            status: 'unpaid',
          });
        }
      }

      // 📧 Send email notification
      const recipientEmail = user.master?.parent_email || user.email;
      const templateKey = status === 'late' ? 'late_notification' : 'present_notification';
      await sendTemplateEmail(templateKey, recipientEmail, {
        student_name: `${user.first_name} ${user.last_name}`,
        session,
        date,
        time,
      });

      return res.status(200).json({
        success: true,
        message: `Time-in recorded for ${session} session (${attendance.status})`,
        user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          student_number: user.student_number,
          grade: user.Grade?.grade_name || 'N/A',
          section: user.section,
          session,
          status: attendance.status,
          date,
          time: attendance.time,
          time_out: attendance.time_out,
        },
      });
    }

    // ⏱ Time-out (allowed anytime after time-in within 6AM–6PM)
    if (!attendance.time_out) {
      attendance.time_out = time;
      await attendance.save();

      const recipientEmail = user.master?.parent_email || user.email;
      await sendTemplateEmail('time_out_notification', recipientEmail, {
        name: `${user.first_name} ${user.last_name}`,
        session,
        date,
        time: attendance.time_out,
      });

      return res.status(200).json({
        success: true,
        message: `Time-out recorded for ${session} session`,
        user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          student_number: user.student_number,
          grade: user.Grade?.grade_name || 'N/A',
          section: user.section,
          session,
          status: attendance.status,
          date,
          time: attendance.time,
          time_out: attendance.time_out,
        },
      });
    }

    // Already completed attendance
    return res.status(400).json({
      success: false,
      message: `Attendance for ${session} session already completed.`,
    });

  } catch (err) {
    console.error('Backend error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during verification.',
      error: err.message,
    });
  }
};



/**
 * 📋 Get All Attendance (with grade and penalties)
 */
export const getAllAttendance = async (req, res) => {
  try {
    const attendanceRecords = await Attendance.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'first_name', 'last_name', 'student_number', 'section', 'grade_id'],
          include: [
            { model: Grade, attributes: ['grade_name'] },
            {model: MasterList, as: 'master', attributes: ['section', 'grade_level', 'room_number']},  
            { model: Penalties, attributes: ['reason', 'amount', 'status', 'created_at'], required: false },
          ],
        },
      ],
      order: [['date', 'DESC'], ['time', 'ASC']],
    });

    const morningRecords = [];
    const afternoonRecords = [];

    attendanceRecords.forEach((record) => {
      const r = record.toJSON();
      r.time = r.time ? moment(r.time, 'HH:mm:ss').format('hh:mm A') : null;
      r.time_out = r.time_out ? moment(r.time_out, 'HH:mm:ss').format('hh:mm A') : null;

      const sessionNormalized = r.session?.toLowerCase().trim();

      const formatted = {
        ...r,
        user: {
          id: r.User.id,
          name: `${r.User.first_name} ${r.User.last_name}`,
          student_number: r.User.student_number,
          grade: r.User.master?.grade_level || 'N/A',
          section: r.User.master?.section || 'N/A',
          penalties: r.User.Penalties || [],
        },
      };

      if (sessionNormalized === 'morning') morningRecords.push(formatted);
      else if (sessionNormalized === 'afternoon') afternoonRecords.push(formatted);
    });

    res.status(200).json({ morning: morningRecords, afternoon: afternoonRecords });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance records', error: error.message });
  }
};

