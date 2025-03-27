// models/Coupon.js
import mongoose from 'mongoose';

// Define the Coupon schema
const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true, // Ensure the coupon code is unique
      trim: true,
    },
    discount: {
      type: Number,
      required: true,
      min: 0, // Ensuring discount cannot be negative
    },
    minPurchaseAmount: {
      type: Number,
      required: true,
      min: 0, // Minimum purchase amount cannot be negative
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true, // By default, coupons are active
    },
  },
  { timestamps: true } // Adds `createdAt` and `updatedAt` fields automatically
);

// Create and export the Coupon model
const Coupon = mongoose.model('Coupon', couponSchema);



export default Coupon;
