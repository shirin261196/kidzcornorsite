// controllers/wishlistController.js

import Wishlist from "../models/wishlistModel.js";


// Add item to wishlist
export const addToWishlist = async (req, res, next) => {
  const { userId, productId, name, price, images, sizes, stock } = req.body;
  try {
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
    }
    const alreadyExists = wishlist.items.some(item => item.productId.toString() === productId);
    if (!alreadyExists) {
      wishlist.items.push({ productId, name, price, images, sizes, stock });
      await wishlist.save();
      const updatedWishlist = await Wishlist.findOne({ userId }).populate('items.productId');
      return res.status(200).json({
        success: true,
        message: 'Item added to wishlist',
        wishlist: updatedWishlist,
        added: true
      });
    }
    const updatedWishlist = await Wishlist.findOne({ userId }).populate('items.productId');
    res.status(200).json({
      success: true,
      message: 'Item already in wishlist',
      wishlist: updatedWishlist,
      added: false
    });
  } catch (error) {
    next(error);
  }
};

// Get user wishlist
export const getWishlist = async (req, res,next) => {
  const { userId } = req.params;
  try {
    const wishlist = await Wishlist.findOne({ userId }).populate('items.productId');
    res.status(200).json(wishlist || { userId, items: [] });
  } catch (error) {
    next(error)
  }
};

// Remove item from wishlist
export const removeFromWishlist = async (req, res, next) => {
  const { userId, productId } = req.body;
  try {
    const wishlist = await Wishlist.findOne({ userId });
    console.log('Before filter:', wishlist?.items, 'productId:', productId);
    if (wishlist) {
      wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId.toString());
      console.log('After filter:', wishlist.items);
      await wishlist.save();
    }
    const updatedWishlist = wishlist || { userId, items: [] };
    res.status(200).json({ success: true, message: 'Item removed from wishlist', wishlist: updatedWishlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};