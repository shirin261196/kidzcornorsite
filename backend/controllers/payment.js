// payment.js
import Razorpay from 'razorpay';
import express from 'express';
import dotenv from 'dotenv';
import userModel from '../models/userModel';

dotenv.config();

const paymentRouter = express.Router(); // Use Router instead of app

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, // Access Key ID from .env
    key_secret: process.env.RAZORPAY_KEY_SECRET, // Access Key Secret from .env
});

// Create Payment Order route
paymentRouter.post('/order', async (req, res) => {
    const { amount, currency = 'INR' } = req.body;

    try {
        const options = {
            amount: amount * 100, // Amount in smallest currency unit (e.g., paise for INR)
            currency,
            receipt: `receipt_${Date.now()}`,
        };

        // Create Razorpay order
        const order = await razorpay.orders.create(options);

        // Send the order details back to the frontend
        res.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount,
        });
       console.log('amount',amount)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating Razorpay order' });
    }
});

// Verify Payment
paymentRouter.post("/verify-payment", async (req, res) => {
    try {
      const { userId, amount } = req.body;
  
      // Find user by userId
      const user = await userModel.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Update wallet balance
      user.walletBalance += amount;
  
      // Add transaction history
      user.transactions.push({ type: "credit", amount });
  
      // Save updated user data
      await user.save();
  
      res.json({ success: true, walletBalance: user.walletBalance });
    } catch (error) {
      res.status(500).json({ message: "Payment verification failed" });
    }
  });
  

export default paymentRouter; // Export the router
