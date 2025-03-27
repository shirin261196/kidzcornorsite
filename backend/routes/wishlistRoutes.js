// routes/wishlistRoutes.js
import express from 'express';
import { addToWishlist, getWishlist, removeFromWishlist } from '../controllers/wishlistController.js';

const wishlistRouter = express.Router();

wishlistRouter.post('/wishlist/add', addToWishlist); // Add to wishlist
wishlistRouter.get('/wishlist/:userId', getWishlist); // Get wishlist by user ID
wishlistRouter.delete('/wishlist/remove', removeFromWishlist); // Remove from wishlist

export default wishlistRouter;
