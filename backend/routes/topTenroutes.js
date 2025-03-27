import express from 'express';
import { bestBrand, bestCategory, bestSeller } from '../controllers/productController.js';
import { userAuth } from '../middleware/userAuth.js';
const bestRouter = express.Router();


bestRouter.get('/best-selling-products',bestSeller);
bestRouter.get('/best-selling-categories',bestCategory);
bestRouter.get('/best-selling-brands',bestBrand);


export default bestRouter;