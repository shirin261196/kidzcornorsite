import express from 'express';
import { addItemToCart, applyCouponToCart, applyOfferToCart, clearCart, getCart, removeCoupon,removeItemFromCart, removeOffer, updateItemQuantity } from '../controllers/cartController.js';
import  {userAuth}  from '../middleware/userAuth.js';



const cartRouter = express.Router();


cartRouter.post('/cart/add', userAuth,addItemToCart);
cartRouter.get('/cart/:userId',userAuth, getCart);
cartRouter.put('/cart/update', userAuth,updateItemQuantity);
cartRouter.delete('/cart/remove/:userId/:productId', userAuth, removeItemFromCart);
cartRouter.delete('/cart/clear/:userId', userAuth, clearCart);

// Apply Discounts
cartRouter.post("/cart/apply-offer", userAuth,applyOfferToCart); // Apply offer to cart
cartRouter.post("/cart/apply-coupon",applyCouponToCart); // Apply coupon to cart
cartRouter.post("/cart/remove-offer", userAuth,removeOffer); // Remove applied offer or coupon
cartRouter.post("/cart/remove-coupon", userAuth,removeCoupon);
export default cartRouter;