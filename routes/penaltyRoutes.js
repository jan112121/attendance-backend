import express from 'express';
import { getAllPenalties, createPenalty, updatePenalty, deletePenalty, markPenaltyAsPaid } from '../controllers/penaltyController.js';

const router = express.Router();

router.get('/', getAllPenalties);        // view all
router.post('/', createPenalty);      // add manually (optional)
router.put('/:id', updatePenalty);    // edit (optional)
router.delete('/:id', deletePenalty); // delete (optional)
router.put('/:id/pay', markPenaltyAsPaid);


export default router;
