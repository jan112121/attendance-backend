import User from "../models/users.js";
import Attendance from "../models/attendance.js";
import Grade from "../models/Levels/grades.model.js";
import Masterlist from "../models/masterList.js";

export const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.params.id;

    // Fetch student with Masterlist and Grade relation
    const student = await User.findByPk(studentId, {
      include: [
        {
          model: Masterlist,
          as: "master",
          attributes: ["section", "room_number", "student_number", "grade_id"],
          include: [
            {
              model: Grade,
              as: "grade",
              attributes: ["grade_name"]
            }
          ]
        }
      ]
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Build full URL for aztec_code_image
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const aztecImageUrl = student.aztec_code_image
      ? `${backendUrl}${student.aztec_code_image}`
      : null;

    // Flatten student object
    const studentData = {
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      student_number: student.student_number || student.master?.student_number || null,
      aztec_code: student.aztec_code,
      aztec_code_image: aztecImageUrl,
      grade: student.master?.grade?.grade_name || null,
      section: student.master?.section || null,
      room_number: student.master?.room_number || null
    };

    // Attendance counts separated by session
    const sessions = ["morning", "afternoon"];
    const summary = {};

    for (const session of sessions) {
      const [present, late, absent, penalty] = await Promise.all([
        Attendance.count({ where: { user_id: studentId, status: "present", session } }),
        Attendance.count({ where: { user_id: studentId, status: "late", session } }),
        Attendance.count({ where: { user_id: studentId, status: "absent", session } }),
        Attendance.count({ where: { user_id: studentId, status: "penalty", session } }) // Add penalty count
      ]);

      summary[session] = { present, late, absent, penalty };
    }

    // Send response
    res.json({
      success: true,
      student: studentData,
      summary
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
