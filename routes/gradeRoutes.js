import express from 'express';
import Grade from '../models/Levels/grades.model.js';
import SchoolLevel from '../models/Levels/schoolLevel.model.js'; // ✅ import properly instead of require

const router = express.Router();

// GET all grades with school level included
router.get('/', async (req, res) => {
  try {
    const grades = await Grade.findAll({
      include: [{
        model: SchoolLevel,
        attributes: ['id', 'level_name']
      }]
    });
    res.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ message: 'Failed to fetch grades' });
  }
});

// GET grades by school level ID
router.get('/by-level/:levelId', async (req, res) => {
  try {
    const { levelId } = req.params;

    const grades = await Grade.findAll({
      where: { school_level_id: levelId },
      attributes: ['id', 'grade_name', 'school_level_id'], // ✅ clean data only
      order: [['id', 'ASC']],
    });

    // Transform to a simpler structure for frontend use
    const formatted = grades.map(g => ({
      id: g.id,
      name: g.grade_name, // rename grade_name → name
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching grades by level:', error);
    res.status(500).json({ message: 'Failed to fetch grades' });
  }
});

export default router;
