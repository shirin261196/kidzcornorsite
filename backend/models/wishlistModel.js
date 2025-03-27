// models/Wishlist.js
import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
      name: String,
      price: Number,
      images: [
        {
          url: { type: String, required: true },
          public_id: { type: String, required: true },
        }
      ],
      sizes: [
        {
          size: { type: String, required: true },
          stock: { type: Number, required: true }
        }
      ],
    },
  ],
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);


export default Wishlist;