import fs from 'fs';
import path from 'path';
import bwipjs from 'bwip-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import MasterList from '../models/masterList.js';
import User from '../models/users.js';

// REGISTER
export const register = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      student_number,
      grade_id,
      section,
      room_number,
      contact_number,
      role_id,
    } = req.body;

    // ✅ Check required fields
    if (!first_name || !last_name || !email || !password || !student_number) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 1️⃣ Check if student_number exists in MasterList
    const validStudent = await MasterList.findOne({ where: { first_name, last_name, student_number } });

    if (!validStudent) {
      return res.status(400).json({
        message: '❌ Student not found in the official school list.',
      });
    }

    // ✅ Check for existing user
    const existingUser = await User.findOne({ where: { email, student_number } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Generate Aztec code text
    const aztecCodeValue = student_number || email;

    // ✅ Create Aztec Code Image
    const aztecPng = await bwipjs.toBuffer({
      bcid: 'azteccode',
      text: aztecCodeValue,
      scale: 5,
      height: 10,
      includetext: false,
    });

    // ✅ Save Aztec PNG file in backend/public/uploads/aztec_codes/
    const fileName = `${aztecCodeValue}_aztec.png`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'aztec_codes');
    const filePath = path.join(uploadDir, fileName);

    // Ensure directory exists
    fs.mkdirSync(uploadDir, { recursive: true });

    // Write PNG file
    fs.writeFileSync(filePath, aztecPng);

    // ✅ Save relative path in DB (so frontend can load it)
    const aztecImagePath = `/uploads/aztec_codes/${fileName}`;

    // ✅ Create new user record
    const user = await User.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      role_id,
      student_number,
      grade_id,
      section,
      room_number,
      contact_number,
      aztec_code: aztecCodeValue,
      aztec_code_image: aztecImagePath,
    });

    // ✅ Create JWT token
    const token = jwt.sign({ id: user.id, role_id: user.role_id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // ✅ Return full backend URL for Angular
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const fullAztecImageUrl = `${backendUrl}${aztecImagePath}`;

    res.status(201).json({
      message: 'Registration successful',
      user,
      token,
      aztecImage: fullAztecImageUrl,
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate token with role
    const token = jwt.sign({ id: user.id, role_id: user.role_id }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role_id: user.role_id,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
