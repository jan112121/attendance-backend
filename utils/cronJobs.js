import cron from 'node-cron';
import { Op } from 'sequelize';
import moment from 'moment-timezone';
import User from '../models/users.js';
import Attendance from '../models/attendance.js';
import AttendanceArchive from '../models/attendanceArchive.js';
import MasterList from '../models/masterList.js';
import Penalties from '../models/penalties.js';
import PenaltyRules from '../models/penaltyRules.js';
import { sendEmailNotification } from './email.js';
import sequelize from '../config/db.js';

/** ✅ Helper: Get current Philippine date */
const getPhilippineDate = () => moment().tz('Asia/Manila').format('YYYY-MM-DD');

/** ✅ Helper: Apply penalty if rule exists */
const applyPenalty = async (user_id, reasonType) => {
  const rule = await PenaltyRules.findOne({
    where: { condition: reasonType.toLowerCase() },
  });

  if (rule) {
    await Penalties.create({
      user_id,
      reason: reasonType.charAt(0).toUpperCase() + reasonType.slice(1),
      amount: rule.amount,
      status: 'unpaid',
    });
    console.log(`💸 Applied ${reasonType} penalty to user ${user_id}`);
  }
};

const checkSessionAttendance = async (session, cronTime) => {
  if (!session) return console.error('❌ Session is undefined!');

  console.log(`🕒 Checking ${session} attendance...`);
  const date = getPhilippineDate();

  // Fetch only students and student councils
  const users = await User.findAll({
    where: { role_id: { [Op.in]: [2, 4] } },
  });

  for (const user of users) {
    const attendance = await Attendance.findOne({
      where: { user_id: user.id, date, session },
    });

    if (!attendance) {
      // 🟥 Automatically mark as absent
      await Attendance.create({
        user_id: user.id,
        date,
        time: cronTime,
        time_out: cronTime,
        session,
        status: 'absent',
        lat: null,
        lng: null,
        created_at: new Date(),
      });

      // 💸 Apply penalty for absence
      await applyPenalty(user.id, 'absent');
      console.log(`⚠️ Marked absent (${session}): ${user.first_name} ${user.last_name}`);

      // 🔍 Get parent info from MasterList
      const masterRecord = await MasterList.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('student_number')),
          user.student_number.toLowerCase()
        ),
      });

      // 📧 Notify parent if email is available
      if (masterRecord && masterRecord.parent_email) {
        const subject = `Absence Notification for ${user.first_name} ${user.last_name}`;
        const message = `
          <p>Dear Parent/Guardian,</p>
          <p>This is to inform you that <strong>${user.first_name}</strong> was marked 
          <strong>ABSENT</strong> during the <strong>${session}</strong> session on <strong>${date}</strong>.</p>
          <p>If this is incorrect, please contact the school administration.</p>
          <p>Thank you.</p>
          <br/>
          <p>— K-12 Smart Attendance System</p>
        `;
        await sendEmailNotification(masterRecord.parent_email, subject, message);
      } else {
        console.warn(`⚠️ No parent email found for ${user.first_name} ${user.last_name}`);
      }
    } else if (!attendance.time && !attendance.time_out) {
      // 🕓 Auto time-out (no manual scan-out)
      attendance.time_out = cronTime;
      await attendance.save();
      console.log(`⏰ Auto time_out set for ${user.first_name} (${session})`);
    }
  }

  console.log(`✅ ${session} attendance check completed.`);
};


/** 🌙 Daily reset & archive (11:59 PM) */
const resetAttendanceDay = async () => {
  try {
    console.log('🌙 Running daily attendance reset...');
    const yesterday = moment().tz('Asia/Manila').subtract(1, 'day').format('YYYY-MM-DD');

    // Get all attendance records for yesterday for students and student councils
    const oldRecords = await Attendance.findAll({
      where: {
        date: yesterday,
      },
      include: [
        {
          model: User,
          attributes: ['id', 'role_id'],
          where: {
            role_id: { [Op.in]: [2, 4] }, // 2 = students, 3 = student councils
          },
        },
      ],
    });

    if (oldRecords.length > 0) {
      // Prepare archive data
      const archiveData = oldRecords.map((r) => ({
        user_id: r.user_id,
        date: r.date,
        time: r.time,
        time_out: r.time_out,
        session: r.session,
        status: r.status,
        lat: r.lat,
        lng: r.lng,
        created_at: r.created_at,
      }));

      await AttendanceArchive.bulkCreate(archiveData);
      await Attendance.destroy({
        where: {
          date: yesterday,
          user_id: oldRecords.map((r) => r.user_id), // only delete archived records
        },
      });

      console.log(`✅ Archived ${archiveData.length} records from ${yesterday}`);
    } else {
      console.log(`ℹ️ No student or student council attendance records to archive for ${yesterday}`);
    }

    console.log('✨ Daily attendance reset completed.');
  } catch (err) {
    console.error('❌ Error during daily attendance reset:', err);
  }
};


/** 🕛 Morning cron (12:15 PM) */
cron.schedule('15 12 * * *', async () => {
  await checkSessionAttendance('morning', '12:15:00');
});

/** 🕕 Afternoon cron (6:00 PM) */
cron.schedule('0 18 * * *', async () => {
  await checkSessionAttendance('afternoon', '18:00:00');
});

/** 🌙 Daily reset cron (11:59 PM) */
cron.schedule('59 23 * * *', async () => {
  await resetAttendanceDay();
});

/** 💡 Optional: manual test calls */
// checkSessionAttendance('morning', '12:15:00');
// checkSessionAttendance('afternoon', '18:00:00');
// resetAttendanceDay();

