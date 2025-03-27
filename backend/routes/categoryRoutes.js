import express from 'express';
import { addCategory, getAllCategories, editCategory, deleteCategory, restoreCategory, getActiveCategories } from '../controllers/categoryController.js';
import { adminAuth } from '../middleware/adminAuth.js';

const categoryRouter = express.Router();

// Routes
categoryRouter.post('/', adminAuth, addCategory);
categoryRouter.get('/', adminAuth, getAllCategories);
categoryRouter.put('/:id', adminAuth, editCategory);
categoryRouter.put('/:id/delete', adminAuth, deleteCategory);
categoryRouter.put('/:id/restore', adminAuth, restoreCategory);
categoryRouter.get('/active',getActiveCategories);
export default categoryRouter;
