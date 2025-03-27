import mongoose from 'mongoose';
import productModel from './productModel.js';

// Define sub-schema for order items
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product',  // Assuming your product model is named "Product"
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',  // Store product category reference
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  trackingStatus: { 
    type: String, 
    default: 'PENDING', 
    set: (value) => value.toUpperCase(), // Automatically convert to uppercase
    enum: ['PENDING', 'SHIPPED', 'DELIVERED', 'RETURN_REQUESTED', 'RETURNED','CANCELLED','RETURN_APPROVED','RETURN_REJECTED'], // Tracking statuses
  },
  razorpayOrderId: {
    type: String,
    required: false, // Optional until Razorpay order is created
  },
  razorpayPaymentId: {
    type: String,
  },
});

// Main order schema
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',  // Assuming your user model is named "User"
    required: true,
  },
  items: [orderItemSchema],
  totalPrice: {
    type: Number,
    required: true,
  },
  discountAmount: { type: Number, default: 0 }, // Total discount applied
  finalPrice: { type: Number, required: true }, // Final payable price after discounts
  totalQuantity: {
    type: Number,
  },
  deliveryCharge: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['CONFIRMED','PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_REJECTED', 'RETURNED','PAYMENT_FAILED'],
    default: 'PENDING',
    set: (value) => value.toUpperCase(), // Convert to uppercase
  },
  paymentStatus: { 
    type: String, 
    default: 'Pending', 
    enum: ['Unpaid', 'Paid', 'Failed', 'Pending']  
  },
  paymentRetries: { type: Number, default: 0 },
  paymentMethod: {
    type: String,
    enum: ['Razorpay', 'COD', 'Wallet'], // Add methods as needed
    default: 'Razorpay',
  },
  razorpayOrderId: {  // Add this field to the root schema
    type: String,
    required: false,
  },
  address: {                          // Adding address to the order schema
    fullname: { type: String },
    phone: { type: String },
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
    country: { type: String },
  },
  returnRequested: { 
    type: Boolean, 
    default: false, 
  }, // Tracks if a return request has been initiated
  adminApproval: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED'], 
    default: 'PENDING', 
  }, // Tracks admin approval status
  refundAmount: { 
    type: Number, 
    default: 0, 
  }, // Tracks refund amount processed
  refundStatus: { 
    type: String, 
    enum: ['PENDING', 'COMPLETED'], 
    default: 'PENDING', 
  }, // Tracks if the refund has been processed
}, { timestamps: true });  // This enables createdAt and updatedAt fields


// 🚀 Post-save hook to update product totalSold count
orderSchema.post("save", async function (doc) {
  for (const item of doc.items) {
    await productModel.findByIdAndUpdate(
      item.product,
      { $inc: { totalSold: item.quantity } }, // Increment totalSold by ordered quantity
      { new: true }
    );
  }
});


// Create the Order model
const Order = mongoose.model('Order', orderSchema);
export default Order;
