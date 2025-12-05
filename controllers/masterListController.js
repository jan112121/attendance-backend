import fs from 'fs';
import csv from 'csv-parser';
import MasterList from '../models/masterList.js';
import SchoolLevel from '../models/Levels/schoolLevel.model.js';
import Grade from '../models/Levels/grades.model.js';

// 📥 CSV Upload with School/Grade Mapping
export const uploadMasterList = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', async () => {
        // Fetch all school levels and grades
        const schoolLevels = await SchoolLevel.findAll();
        const grades = await Grade.findAll();

        // Create maps for easy lookup
        const schoolMap = {};
        schoolLevels.forEach(s => {
          schoolMap[s.id] = s.id; // numeric ID as-is
          schoolMap[s.level_name.toLowerCase()] = s.id; // string to ID
        });

        const gradeMap = {};
        grades.forEach(g => {
          gradeMap[g.id] = g.id; // numeric ID as-is
          gradeMap[g.grade_name.toLowerCase()] = g.id; // string to ID
        });

        const bulkData = [];
        const invalidRows = [];
        const ignoredColumnsLog = [];

        for (const row of rows) {
          if (!row.student_number || !row.first_name || !row.last_name) {
            invalidRows.push(row);
            continue;
          }

          // Convert school_level and grade to IDs (accept either string or number)
          let school_level_id = null;
          if (row.school_level) {
            const key = isNaN(row.school_level) ? row.school_level.toLowerCase() : parseInt(row.school_level);
            school_level_id = schoolMap[key] || null;
          }

          let grade_id = null;
          if (row.grade) {
            const key = isNaN(row.grade) ? row.grade.toLowerCase() : parseInt(row.grade);
            grade_id = gradeMap[key] || null;
          }

          // Only keep valid fields
          const validFields = [
            'student_number', 'first_name', 'last_name', 'parent_name',
            'parent_number', 'parent_email', 'grade_level', 'section',
            'room_number', 'additional_info'
          ];

          const filteredData = {};
          const ignoredColumns = [];
          Object.keys(row).forEach(key => {
            if (validFields.includes(key)) filteredData[key] = row[key];
            else ignoredColumns.push(key);
          });

          filteredData.school_level_id = school_level_id;
          filteredData.grade_id = grade_id;

          if (ignoredColumns.length > 0) {
            ignoredColumnsLog.push({ student_number: row.student_number, ignoredColumns });
          }

          bulkData.push(filteredData);
        }

        await MasterList.bulkCreate(bulkData, {
          updateOnDuplicate: [
            'first_name', 'last_name', 'parent_name', 'parent_number',
            'parent_email', 'grade_level', 'section', 'room_number',
            'additional_info', 'school_level_id', 'grade_id'
          ]
        });

        fs.unlinkSync(filePath);

        res.status(200).json({
          message: 'CSV upload complete',
          totalProcessed: bulkData.length,
          invalidRowsCount: invalidRows.length,
          invalidRows,
          ignoredColumnsLog
        });
      });
  } catch (error) {
    console.error('❌ Error processing file upload:', error);
    res.status(500).json({ message: 'Failed to process file upload', error });
  }
};

// 👀 Get all master list entries
export const getMasterListCount = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await MasterList.findAndCountAll({
      limit,
      offset,
      order: [['id', 'ASC']],
      include: [
        {
          model: SchoolLevel,
          as: 'schoolLevel',
          attributes: ['id', 'level_name'], // Send level_name to frontend
        },
        {
          model: Grade,
          as: 'grade',
          attributes: ['id', 'grade_name'], // Send grade_name to frontend
        },
      ],
    });

    // Map the response to include only needed fields for the frontend
    const students = rows.map((student) => ({
      id: student.id,
      student_number: student.student_number,
      first_name: student.first_name,
      last_name: student.last_name,
      parent_name: student.parent_name,
      parent_number: student.parent_number,
      parent_email: student.parent_email,
      section: student.section,
      room_number: student.room_number,
      additional_info: student.additional_info,
      school_level_id: student.school_level_id,
      grade_id: student.grade_id,
      schoolLevel: student.schoolLevel
        ? { id: student.schoolLevel.id, level_name: student.schoolLevel.level_name }
        : null,
      grade: student.grade
        ? { id: student.grade.id, grade_name: student.grade.grade_name }
        : null,
    }));

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      students,
    });
  } catch (error) {
    console.error('❌ Error fetching master list:', error);
    res.status(500).json({ message: 'Failed to load master list', error: error.message });
  }
};


// 🗑️ Delete a specific record
export const clearMasterList = async (req, res) => {
  try {
    // This will delete all rows and reset the auto-increment counter
    await MasterList.destroy({
      where: {}, // no condition = delete all
      truncate: true, // resets auto-increment IDs
    });

    res.status(200).json({ message: 'Master list cleared successfully.' });
  } catch (error) {
    console.error('Error clearing master list:', error);
    res.status(500).json({ message: 'Failed to clear master list.', error: error.message });
  }
};

// Bulk insert from JSON
export const importFromJson = async (req, res) => {
  try {
    const data = req.body; // expecting an array of objects
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: 'Invalid data format' });
    }
    await MasterList.bulkCreate(data, { ignoreDuplicates: true });
    res.status(200).json({ message: 'Data imported successfully', count: data.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Bulk import failed', error });
  }
};

// Delete One student info

export const deleteStudent = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await MasterList.destroy({ where: { id } });

    if (deleted) {
      res.json({ success: true, message: 'Student deleted successfully.' });
    } else {
      res.status(404).json({ success: false, message: 'Student not found.' });
    }
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      student_number,
      first_name,
      last_name,
      parent_name,
      parent_number,
      parent_email,
      section,
      room_number,
      additional_info,
      school_level_id, // from dropdown
      grade_id         // from dropdown
    } = req.body;

    // Check if student exists
    const student = await MasterList.findByPk(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Optional: validate foreign keys
    if (school_level_id) {
      const schoolLevelExists = await SchoolLevel.findByPk(school_level_id);
      if (!schoolLevelExists) {
        return res.status(400).json({ success: false, message: 'Invalid school level selected.' });
      }
    }
    if (grade_id) {
      const gradeExists = await Grade.findByPk(grade_id);
      if (!gradeExists) {
        return res.status(400).json({ success: false, message: 'Invalid grade selected.' });
      }
    }

    // Update the student
    await student.update({
      student_number,
      first_name,
      last_name,
      parent_name,
      parent_number,
      parent_email,
      section,
      room_number,
      additional_info,
      school_level_id,
      grade_id
    });

    res.json({ success: true, message: 'Student updated successfully.' });

  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const addStudent = async (req, res) => {
  try {
    const {
      student_number,
      first_name,
      last_name,
      parent_name,
      parent_number,
      parent_email,
      grade_level,
      section,
      room_number,
      additional_info,
      school_level_id, // can be provided as ID
      grade_id         // can be provided as ID
    } = req.body;

    // Basic validation
    if (!student_number || !first_name || !last_name) {
      return res.status(400).json({ message: 'Student number, first name, and last name are required.' });
    }

    // Optional: Validate that provided school_level_id exists
    if (school_level_id) {
      const schoolExists = await SchoolLevel.findByPk(school_level_id);
      if (!schoolExists) {
        return res.status(400).json({ message: 'Invalid school level ID.' });
      }
    }

    // Optional: Validate that provided grade_id exists
    if (grade_id) {
      const gradeExists = await Grade.findByPk(grade_id);
      if (!gradeExists) {
        return res.status(400).json({ message: 'Invalid grade ID.' });
      }
    }

    const student = await MasterList.create({
      student_number,
      first_name,
      last_name,
      parent_name,
      parent_number,
      parent_email,
      grade_level,
      section,
      room_number,
      additional_info,
      school_level_id: school_level_id || null,
      grade_id: grade_id || null,
    });

    res.status(201).json({ message: 'Student added successfully!', student });

  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ message: 'Failed to add student', error });
  }
};