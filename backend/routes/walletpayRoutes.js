import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import userModel from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config();
const payRouter = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ **1. Create Razorpay Order for Wallet Payment**
payRouter.post("/create-order", async (req, res, next) => {
    try {
      console.log("🛠️ Received Request Body:", req.body); 
  
      if (!req.body) {
        return res.status(400).json({ success: false, message: "Request body is empty" });
      }
  
      const { amount, userId } = req.body;
  
      if (!userId || !amount) {
        console.error("❌ Missing userId or amount:", req.body);
        return res.status(400).json({ success: false, message: "User ID and amount are required" });
      }
  
      console.log("📌 Creating Razorpay Order: amount =", amount, "userId =", userId);
  
      const order = await razorpay.orders.create({
        amount: amount * 100, // Convert INR to paise
        currency: "INR",
        receipt: `WAL${Date.now()}`.slice(0, 40),
        payment_capture: 1, // Auto-capture payment
      });
  
      console.log("✅ Razorpay Order Created:", order);
      res.json({ success: true, order });
    } catch (error) {
      console.error("❌ Error creating order:", error); // Log exact error
      res.status(500).json({ success: false, message: error.message }); // Send error message in response
    }
  });

// ✅ **2. Verify Payment and Credit Wallet**
payRouter.post("/verify-payment", async (req, res,next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, amount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !amount) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature, payment failed!" });
    }

    // ✅ Update user's wallet balance
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.walletBalance += amount; // Add amount to wallet balance

    // ✅ Add transaction to wallet history
    user.walletTransactions.push({
      type: "CREDIT",
      amount,
      description: "Wallet recharge via Razorpay",
      date: new Date(),
    });

    await user.save();

    res.json({ success: true, message: "Wallet credited successfully!", walletBalance: user.walletBalance });
  } catch (error) {
    next(error)
  }
});

export default payRouter;