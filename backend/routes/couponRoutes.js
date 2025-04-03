import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { createCoupon, deactivateCoupon, deleteCoupon, getCoupons, updateCoupon } from '../controllers/couponController.js';
import { userAuth } from '../middleware/userAuth.js';


const couponRouter = express.Router();

couponRouter.post('/admin/coupon', adminAuth,createCoupon);
couponRouter.get('/admin/coupon',getCoupons);

couponRouter.delete('/admin/coupon/:couponId', adminAuth,deleteCoupon);

couponRouter.put('/admin/coupon/:id', adminAuth, updateCoupon);

couponRouter.put('/admin/coupon/deactivate/:couponId', adminAuth, deactivateCoupon);

export default couponRouter;