import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { getAllUsers, toggleUserStatus } from '../controllers/adminController.js';

const adminRouter = express.Router();

// Route to get all users
adminRouter.get('/users', adminAuth, getAllUsers);

// Route to toggle user block/unblock status
adminRouter.put('/users/:id', adminAuth, toggleUserStatus);



export default adminRouter;
