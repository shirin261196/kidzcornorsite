import Order from '../models/orderModel.js';
import Razorpay from 'razorpay';


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const retryPayment = async (req, res) => {
    const { orderId } = req.body;
  
    try {
      // Find the failed order
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
  
      if (order.paymentStatus === 'Paid') {
        return res.status(400).json({ success: false, message: 'Payment already completed' });
      }
  
      // 1. Create a new Razorpay order for retry
      const razorpayOrder = await razorpay.orders.create({
        amount: order.finalPrice * 100, // Razorpay accepts amount in paisa
        currency: 'INR',
        receipt: `retry_${orderId}`,
      });
  
      // 2. Update order with new Razorpay order ID
      order.razorpayOrderId = razorpayOrder.id; // Update main order's Razorpay ID
      order.items.forEach((item) => {
        item.razorpayOrderId = razorpayOrder.id;
      });
      order.paymentStatus = 'Unpaid';
      order.lastPaymentAttempt = Date.now();
      await order.save();
  
      return res.status(200).json({
        success: true,
        message: 'Retry payment initiated',
        orderId: razorpayOrder.id,
      });
    } catch (error) {
      console.error('Error in retryPayment:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  


export const handlePaymentFailure = async (req, res) => {
  try {
    const { orderId, failureReason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentStatus = 'Failed';
    order.paymentFailureReason = failureReason || 'Payment failed due to an unknown error';
    order.lastPaymentAttempt = new Date();

    await order.save();

    res.status(200).json({ message: 'Payment failure recorded', order });
  } catch (error) {
    res.status(500).json({ message: 'Error handling failed payment', error });
  }
};

export const razorpayWebhook = async (req, res) => {
    try {
      const { event, payload } = req.body;
  
      if (event === 'payment.failed') {
        const payment = payload.payment.entity;
        const razorpayOrderId = payment.order_id; // Get order ID from payment failure
  
        // Find the order in the database
        const order = await Order.findOne({ razorpayOrderId });
  
        if (!order) {
          return res.status(404).json({ message: 'Order not found for this payment' });
        }
  
        // Update order status
        order.paymentStatus = 'Failed';
        order.paymentFailureReason = payment.error_description || 'Payment failed';
        order.lastPaymentAttempt = new Date();
  
        await order.save();
  
        return res.status(200).json({ message: 'Payment failure updated successfully' });
      }
  
      res.status(400).json({ message: 'Unhandled event type' });
    } catch (error) {
      console.error('Webhook Error:', error);
      res.status(500).json({ message: 'Webhook processing error', error });
    }
  };
  