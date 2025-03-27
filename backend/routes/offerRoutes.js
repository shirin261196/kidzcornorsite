import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { createCategoryOffer, createProductOffer, createReferrerOffer, deleteOffer, getOffers, updateOffer } from '../controllers/offerController.js';


const offerRouter = express.Router();

offerRouter.post('/product', adminAuth,createProductOffer);
offerRouter.post('/category', adminAuth,createCategoryOffer);
offerRouter.post('/referral', adminAuth,createReferrerOffer);
offerRouter.get('/', getOffers);
offerRouter.put('/:id', adminAuth,updateOffer);
offerRouter.delete('/:id', adminAuth,deleteOffer);



export default offerRouter;