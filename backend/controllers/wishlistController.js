// controllers/wishlistController.js

import Wishlist from "../models/wishlistModel.js";


// Add item to wishlist
export const addToWishlist = async (req, res) => {
  const { userId, productId, name, price, images,sizes,stock } = req.body;
  try {
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
    }
    const alreadyExists = wishlist.items.some(item => item.productId.toString() === productId);
    if (!alreadyExists) {
      wishlist.items.push({ productId, name, price, images ,sizes,stock});
      await wishlist.save();
    }
    res.status(200).json({ message: 'Item added to wishlist', wishlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user wishlist
export const getWishlist = async (req, res) => {
  const { userId } = req.params;
  try {
    const wishlist = await Wishlist.findOne({ userId }).populate('items.productId');
    res.status(200).json(wishlist || { userId, items: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove item from wishlist
export const removeFromWishlist = async (req, res) => {
  const { userId, productId } = req.body;
  try {
    const wishlist = await Wishlist.findOne({ userId });
    if (wishlist) {
      wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId);
      await wishlist.save();
    }
    res.status(200).json({ message: 'Item removed from wishlist', wishlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
