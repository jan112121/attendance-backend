import express from 'express';
import ArchiveReports from '../models/archiveReports.js';

const router = express.Router();

/** 🔹 Get all archive reports (latest first) */
router.get('/', async (req, res) => {
  try {
    const reports = await ArchiveReports.findAll({
      order: [['run_date', 'DESC']],
      limit: 12, // latest 12 months
    });

    res.json(reports);
  } catch (err) {
    console.error('❌ Error fetching archive reports:', err);
    res.status(500).json({ error: 'Failed to fetch archive reports.' });
  }
});

export default router;