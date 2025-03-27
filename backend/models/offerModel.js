import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  offerType: {
    type: String, // 'Product', 'Category', or 'Referral'
    required: true,
  },
  offerCode: {
    type: String,
    required: true,
    unique: true,
  },
  offerDescription: { 
    type: String, 
    required: true 
  },
  discount: {
    type: Number, // Discount in percentage
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product',
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  referralCode: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const Offer = mongoose.model('Offer', offerSchema);
export default Offer;

