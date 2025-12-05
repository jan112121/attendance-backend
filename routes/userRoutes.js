import express from 'express';
import { getAllUsers,updateUser,deleteUser, addUser } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';


const router = express.Router();

router.post('/add',authMiddleware([1]), addUser);
router.get('/',authMiddleware([1]), getAllUsers);
router.put('/:id',authMiddleware([1]), updateUser);
router.delete('/:id',authMiddleware([1]), deleteUser);


export default router;
