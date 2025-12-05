import express from 'express';
import { getRules, createRule, updateRule, deleteRule } from '../controllers/penaltyRuleController.js';

const router = express.Router();

router.get('/', getRules);
router.post('/', createRule);
router.put('/:id', updateRule);
router.delete('/:id', deleteRule);

export default router;
