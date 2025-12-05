import express from 'express';
import Grade from "../models/Levels/grades.model.js";

const router = express.Router();

router.get('/by-grade/:gradeId', async (req, res) => {
    const grades = await Grade.findAll({where: {school_level_id: req.params.gradId}});
    res.json(grades);
});

export default router;