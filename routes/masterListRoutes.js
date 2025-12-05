import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  uploadMasterList,
  getMasterListCount,
  clearMasterList,
  importFromJson,
  deleteStudent,
  updateStudent,
  addStudent,
} from '../controllers/masterListController.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/csv_uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Appending extension
  },
});

// Configure multer for file uploads
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'text/csv') cb(null, true);
    else cb(new Error('Only CSV files are allowed!'), false);
  },
});
router.post('/upload', upload.single('file'), uploadMasterList);
router.get('/', getMasterListCount);
router.post('/bulk', importFromJson);

// 🧩 Update and delete single student (by ID)
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);
router.post('/add', addStudent);

// 🧹 Delete all students
router.delete('/', clearMasterList);

export default router;
