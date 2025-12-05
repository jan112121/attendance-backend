import express from 'express';
import SchoolLevel from '../models/Levels/schoolLevel.model.js'

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const levels = await SchoolLevel.findAll();
        res.json(levels);
    } catch (err) {
        res.status(500).json({message: 'Error fetching Levels'})
    }
});

export default router;