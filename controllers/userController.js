import User from '../models/users.js';
import Role from '../models/Roles.js';
import Grade from '../models/Levels/grades.model.js';
import bcrypt from 'bcryptjs';
import BwipJs from 'bwip-js';
import fs from 'fs';
import path from 'path';
import Attendance from '../models/attendance.js';
import AttendanceArchive from '../models/attendanceArchive.js';
import Penalty from '../models/penalties.js';
import  cloudinary  from '../utils/cloudinary.js';

// 🧭 Helper to safely delete a file if it exists
const safeDeleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted file: ${filePath}`);
    }
  } catch (err) {
    console.error(`⚠️ Failed to delete file (${filePath}):`, err.message);
  }
};

// 🧾 Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        'id',
        'first_name',
        'last_name',
        'email',
        'role_id',
        'contact_number',
        'student_number',
        'grade_id',
        'section',
        'created_at',
        'status',
        'room_number',
      ],
      include: [
        { model: Role, attributes: ['role_name'] },
        { model: Grade, attributes: ['grade_name'] },
      ],
    });

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      contact_number: u.contact_number,
      student_number: u.student_number,
      room_number: u.room_number,
      role_id: u.role_id,
      role: u.Role?.role_name || 'N/A',
      grade: u.Grade?.grade_name || null,
      section: u.section,
      status: u.status,
      created_at: u.created_at,
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error('❌ Error fetching users:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// ✏️ Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, contact_number, role_id } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.update({ first_name, last_name, email, contact_number, role_id });
    await user.reload({ include: [Role] });

    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        contact_number: user.contact_number,
        role_id: user.role_id,
        role: user.Role?.role_name || 'N/A',
      },
    });
  } catch (err) {
    console.error('❌ Error updating user:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// 🗑️ Delete user (deep cleanup)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 🧠 Prevent deleting yourself
    if (req.user && req.user.id === parseInt(id)) {
      return res.status(400).json({ message: 'You cannot delete yourself' });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    console.log(`🧹 Starting deep delete for user ID: ${id}`);

    // 1️⃣ Delete related Attendance records
    await Attendance.destroy({ where: { user_id: id } });

    // 2️⃣ Delete related AttendanceArchive records
    await AttendanceArchive.destroy({ where: { user_id: id } });

    // 3️⃣ Delete related Penalty records (if any)
    if (Penalty) {
      await Penalty.destroy({ where: { user_id: id } });
      console.log(`💸 Deleted penalties for user ${id}`);
    }

    // 4️⃣ Delete Aztec image
    if (user.aztec_code_image) {
      const baseDir = path.join(process.cwd(), 'public');
      let imgPath = user.aztec_code_image;

      // Convert relative path to full
      if (imgPath.startsWith('/uploads')) {
        imgPath = path.join(baseDir, imgPath);
      }

      safeDeleteFile(imgPath);
    }

    // 5️⃣ Delete the user itself
    await user.destroy();

    console.log(`✅ Successfully deleted user ${id} and all related data`);

    res.status(200).json({ message: 'User and all related records deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting user:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// ➕ Add new user
export const addUser = async (req, res) => {
  try {
    const { first_name, last_name, email, student_number, role_id, contact_number, password } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Aztec code data
    const aztecData = student_number || email;

    // Generate Aztec code PNG buffer
    const pngBuffer = await BwipJs.toBuffer({
      bcid: "azteccode",
      text: aztecData,
      scale: 5,
      height: 10,
      includetext: false,
    });

    // Temporarily save buffer to a file (required by Cloudinary uploader)
    const tempFilePath = `./tmp/${aztecData}_aztec.png`;
    fs.mkdirSync(path.join(process.cwd(), "tmp"), { recursive: true });
    fs.writeFileSync(tempFilePath, pngBuffer);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(tempFilePath, {
      folder: "aztec_codes",      // folder in Cloudinary
      public_id: aztecData,       // optional: name the file by student_number/email
      overwrite: true,
    });

    // Remove temporary file
    fs.unlinkSync(tempFilePath);

    // Create user with Cloudinary URL for aztec_code_image
    const newUser = await User.create({
      first_name,
      last_name,
      email,
      student_number,
      role_id,
      contact_number,
      password: hashed,
      aztec_code: aztecData,
      aztec_code_image: result.secure_url, // store cloud URL
    });

    res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (err) {
    console.error("❌ Error adding user:", err);
    res.status(500).json({ message: "Server error while adding user" });
  }
};