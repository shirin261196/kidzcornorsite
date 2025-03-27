import Razorpay from "razorpay";
import Order from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";
import crypto from 'crypto'; // Correct for ES Modules
import dotenv from 'dotenv';
import Ledger from "../models/ledgerModal.js";


dotenv.config();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


export const createOrder = async (req, res, next) => {
  const { items, totalPrice, totalQuantity, discountAmount, address, paymentMethod } = req.body;
  console.log("📩 Received Order Request:", req.body);
  console.log("items", items);

  try {
    // Check if the user exists
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const DELIVERY_CHARGE = 50;

    // Validate and update stock for each product in the order
    for (const item of items) {
      const product = await productModel.findById(item.product).populate("category");
      if (product) {
        const sizeData = product.sizes.find((s) => s.size === item.size);
        if (sizeData && sizeData.stock >= item.quantity) {
          sizeData.stock -= item.quantity; // Deduct stock
        } else {
          return res.status(400).json({
            message: `Insufficient stock for size ${item.size} of product ${product.name}`,
          });
        }
        await product.save();
      } else {
        return res.status(404).json({ message: `Product not found for ID ${item.product}` });
      }
    }

    // Calculate final price
    const finalPrice = totalPrice - discountAmount + DELIVERY_CHARGE;

    if (paymentMethod === "COD" && finalPrice > 1000) {
      return res.status(400).json({ message: "COD is not allowed for orders above ₹1000." });
    }

    if (finalPrice <= 0) {
      return res.status(400).json({ message: "Final price must be greater than 0." });
    }

    // **Prepare Order Data**
    const orderData = {
      user: req.user.id,
      items: items.map((item) => ({
        product: item.product,
        category: item.category || null, // If populated earlier, it'll be available
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        trackingStatus: "PENDING",
      })),
      totalPrice,
      discountAmount,
      finalPrice,
      deliveryCharge: DELIVERY_CHARGE,
      totalQuantity,
      status: "PENDING",
      address,
      paymentMethod,
    };

    // **Wallet Payment Handling**
    if (paymentMethod === "Wallet") {
      if (user.walletBalance < finalPrice) {
        return res.status(400).json({ message: "Insufficient wallet balance." });
      }

      // Deduct wallet balance
      user.walletBalance -= finalPrice;

      // Save transaction in wallet history
      user.walletTransactions.push({
        type: "DEBIT",
        amount: finalPrice,
        description: "Order Payment",
        date: new Date(),
      });

      await user.save(); // Save updated wallet balance

      // Save Order in Database
      orderData.paymentStatus = "Paid"; // Wallet is pre-paid
      const newOrder = new Order(orderData);
      await newOrder.save();

      console.log("✅ Order Saved in DB:", newOrder);

      // Ledger Entry
      await Ledger.create({
        user: req.user.id,
        order: newOrder._id,
        type: "ORDER_PAYMENT",
        amount: finalPrice,
        description: `Payment for order ${newOrder._id} via Wallet`,
        balanceAfterTransaction: user.walletBalance,
      });

      return res.status(201).json({
        message: "Order placed successfully using Wallet",
        order: newOrder,
      });
    }

    // **Razorpay Payment Handling**
    let razorpayOrder = null;
    if (paymentMethod === "Razorpay") {
      try {
        razorpayOrder = await razorpay.orders.create({
          amount: Math.round(finalPrice * 100),
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
        });
        console.log("✅ Razorpay Order Created:", razorpayOrder);
        orderData.razorpayOrderId = razorpayOrder.id;
        orderData.paymentStatus = "Pending"; // Payment not yet confirmed
      } catch (error) {
        console.error("Error during Razorpay order creation:", error.message);
        return res.status(500).json({
          message: "Failed to create Razorpay order. Please try again later.",
          error: error.message,
        });
      }
    }

    // **COD Payment Handling**
    if (paymentMethod === "COD") {
      orderData.paymentStatus = "Pending"; // COD is always pending
    }

    // **Save Order**
    const newOrder = new Order(orderData);
    await newOrder.save();

    console.log("✅ Order Saved Successfully:", newOrder);
    console.log("✅ Saved Razorpay Order ID:", newOrder.razorpayOrderId);

    // **Ledger Entry**
    await Ledger.create({
      user: req.user.id,
      order: newOrder._id,
      type: "ORDER_PAYMENT",
      amount: finalPrice,
      description: `Order ${newOrder._id} placed with ${paymentMethod} (${
        paymentMethod === "COD" ? "Pending Payment" : "Paid"
      })`,
      balanceAfterTransaction: paymentMethod === "Wallet" ? user.walletBalance : user.walletBalance || 0

    });

    return res.status(201).json({
      message: `Order placed successfully using ${paymentMethod}`,
      order: newOrder,
      ...(paymentMethod === "Razorpay" && {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      }), // Conditionally include Razorpay details
    });
    
  } catch (error) {
    console.error("❌ Error Creating Order:", error);
    return res.status(500).json({ message: "Failed to place order", error });
  }
};



// 
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    console.log("🔍 Received Payment Details:", { razorpay_payment_id, razorpay_order_id, razorpay_signature });

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment details." });
    }

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });

    if (!order) {
      console.log("❌ Order not found. Razorpay Order ID:", razorpay_order_id);
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    console.log("📜 Found Order:", order);

    // Razorpay signature verification
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      order.paymentStatus = "Failed";
      order.status = "PAYMENT_FAILED";
      await order.save();
      console.log("❌ Signature verification failed for Order:", order._id);
      return res.status(400).json({ success: false, message: "Payment verification failed." });
    }

    // Success case
    order.paymentStatus = "Paid";
    order.status = "CONFIRMED"; // Should be CONFIRMED, not PENDING
    order.paymentMethod = "Razorpay";

    order.items.forEach((item) => {
      item.razorpayPaymentId = razorpay_payment_id;
    });

    await order.save();
    console.log("✅ Payment Verified and Order Updated:", order);

    return res.status(200).json({ success: true, message: "Payment verified successfully", order });
  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    // Update order to failed if an unexpected error occurs
    const order = await Order.findOne({ razorpayOrderId: req.body.razorpay_order_id });
    if (order) {
      order.paymentStatus = "Failed";
      order.status = "PAYMENT_FAILED";
      await order.save();
    }
    next(error);
  }
};


export const paymentFailed =async(req,res,next)=>{
  try {
    const { razorpay_order_id } = req.body;


    if (! razorpay_order_id) {
        return res.status(400).json({ success: false, message: "Order ID is required." });
    }
    const order = await Order.findOne({  razorpayOrderId: razorpay_order_id});



    if (!order) {
        return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Update order status to failed
    order.paymentStatus = "Failed";
    order.status = "PAYMENT_FAILED";
    await order.save();

    res.status(200).json({ success: true, message: "Order marked as failed." });
} catch (error) {
    console.error("Error updating failed payment:", error);
   next(error)
}
}
export const retryPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required." });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (order.paymentStatus !== "Failed") {
      return res.status(400).json({ success: false, message: "Only failed payments can be retried." });
    }

    // Create a new Razorpay order
    const newOrder = await razorpay.orders.create({
      amount: order.finalPrice * 100, // Convert to paise
      currency: "INR",
      receipt: `retry_${order._id}`,
      payment_capture: 1
    });

    // Update order with new Razorpay Order ID
    order.razorpayOrderId = newOrder.id; // Store at root level (consistent with schema)
    order.items.forEach((item) => {
      item.razorpayOrderId = newOrder.id; // Also update in items if needed
      item.razorpayPaymentId = null; // Clear previous payment ID
    });

    order.paymentStatus = "Pending";
    order.paymentRetries += 1;
    await order.save();

    res.status(200).json({
      success: true,
      message: "Retry payment initiated.",
      newOrderId: newOrder.id,
      order,
    });

  } catch (error) {
    console.error("Error retrying payment:", error);
    res.status(500).json({ success: false, message: "Failed to retry payment." });
  }
};


export const cancelOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { itemId } = req.query; // Extract itemId from query
    console.log("Backend - OrderId:", orderId, "ItemId:", itemId); // Debug logging
    const userId = req.user.id;
    // Validate presence of itemId
    if (!itemId) {
      return res.status(400).json({ message: "ItemId is required" });
    }

    // Find the order by ID
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Find the specific item in the order
    const item = order.items.find((i) => i._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in order' });
    }

    // Update logic for cancellation
    if (item.trackingStatus === 'CANCELLED') {
      return res.status(400).json({ message: 'Item is already cancelled' });
    }
    item.trackingStatus = 'CANCELLED';

    // Restore stock
    const product = await productModel.findById(item.product);
    if (product) {
      const sizeData = product.sizes.find((s) => s.size === item.size);
      if (sizeData) {
        sizeData.stock += item.quantity;
        await product.save();
      }
    }

      // Update the wallet balance
      const refundAmount = item.price * item.quantity; // Calculate refund amount
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      user.walletBalance += refundAmount; // Add refund to user's wallet
      await user.save();

    // Save updated order
    const allItemsCancelled = order.items.every((i) => i.trackingStatus === 'CANCELLED');
    if (allItemsCancelled) order.status = 'CANCELLED';
    await order.save();



    res.json({
      message: "Order item cancelled successfully, and wallet updated",
      updatedOrder: order,
      walletBalance: user.walletBalance,
    });

  } catch (error) {
    
    next(error);
  }
};

export const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in req.user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ walletBalance: user.walletBalance });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    res.status(500).json({ message: "Failed to fetch wallet balance" });
  }
};



// Return Order Controller
export const requestReturn = async (req, res, next) => {
  const { orderId, itemId } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const item = order.items.find((i) => i._id.toString() === itemId);

    if (!item) return res.status(404).json({ message: 'Item not found in the order' });

    if (item.trackingStatus !== 'DELIVERED')
      return res.status(400).json({ message: 'Return can only be requested for delivered items' });

    // Mark the item as return requested
    item.trackingStatus = 'RETURN_REQUESTED';
    order.returnRequested = true;
    order.adminApproval = 'PENDING';

    await order.save();
    res.status(200).json({ message: 'Return request submitted', order });
  } catch (error) {
    next(error);
  }
};

export const approveReturn = async (req, res, next) => {
  const { orderId, itemId } = req.params;  // Extract from route params
  const { approvalStatus } = req.body; // approvalStatus: APPROVED/REJECTED

  try {
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const item = order.items.find((i) => i._id.toString() === itemId);

    if (!item) return res.status(404).json({ message: 'Item not found in the order' });

    if (item.trackingStatus !== 'RETURN_REQUESTED')
      return res.status(400).json({ message: 'Return request not found for this item' });

    if (approvalStatus === 'APPROVED') {
      item.trackingStatus = 'RETURN_APPROVED';
      order.adminApproval = 'APPROVED';
    } else if (approvalStatus === 'REJECTED') {
      item.trackingStatus = 'RETURN_REJECTED';
      order.adminApproval = 'REJECTED';
    } else {
      return res.status(400).json({ message: 'Invalid approval status' });
    }

    await order.save();
    res.status(200).json({ message: `Return ${approvalStatus.toLowerCase()}`, order });
  } catch (error) {
    next(error);
  }
};


export const processRefund = async (req, res, next) => {
  const { orderId } = req.params;

  try {
    // Fetch the order by ID and populate the user field
    const order = await Order.findById(orderId).populate('user').populate('items.product');
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Get the user associated with the order
    const user = order.user;
    if (!user) {
      return res.status(404).json({ message: 'User not found for this order.' });
    }

    let totalRefund = 0;

    // Process refund for all items in the order
    for (const item of order.items) {
      if (item.trackingStatus !== 'RETURNED') {
        item.trackingStatus = 'RETURNED';

        // Update product stock
        const product = await productModel.findById(item.product._id);
        if (product) {
          const sizeData = product.sizes.find((s) => s.size === item.size);
          if (sizeData) {
            sizeData.stock += item.quantity; // Increment stock
            await product.save();
          }
        }

        totalRefund += item.price * item.quantity; // Calculate refund
      }
    }

    if (totalRefund === 0) {
      return res.status(400).json({ message: 'No refundable items found in this order.' });
    }

    // Credit refund to the user's wallet
    user.walletBalance += totalRefund;
    user.walletTransactions.push({
      type: 'CREDIT',
      amount: totalRefund,
      description: `Refund for order ${orderId}`,
    });
    await user.save();

    // Update order status
    order.status = 'RETURNED';
    order.refunded = true;
    order.refundAmount = totalRefund;
    await order.save();

       // Log Refund in Ledger
       await Ledger.create({
        user: user._id,
        order: order._id,
        type: "REFUND",
        amount: totalRefund,
        description: `Refund for order ${order._id}`,
        balanceAfterTransaction: user.walletBalance,
      });

    res.status(200).json({
      message: 'Refund processed successfully and credited to wallet.',
      updatedOrder: order,
      walletBalance: user.walletBalance,
    });
  } catch (error) {
   next(error)
  }
};





// Change the tracking status of a product in an order
export const changeTrackingStatus = async (req, res, next) => {
  const { orderId, productId } = req.params;
  const { trackingStatus } = req.body;

  console.log('Received orderId:', orderId); // Debugging log
  console.log('Received productId:', productId); // Debugging log
  console.log('Received trackingStatus:', trackingStatus); // Debugging log

  // Validate the tracking status
  if (!['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(trackingStatus)) {
    return res.status(400).json({ message: 'Invalid tracking status', receivedTrackingStatus: trackingStatus });
  }

  // Fetch the order with populated product details
  const order = await Order.findById(orderId).populate('items.product');
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  console.log('Populated order items:', order.items);  // Log populated order items

  // Find the product in the order using populated _id
  const product = order.items.find(item => item.product._id.toString() === productId);

  if (!product) {
    return res.status(404).json({ message: 'Product not found in the order' });
  }

  // Update the tracking status
  product.trackingStatus = trackingStatus;
  order.markModified('items');  // Mark 'items' as modified

  console.log('Updated product tracking status:', product.trackingStatus);

  // Recalculate the order status based on all item tracking statuses
  const trackingStatuses = order.items.map(item => item.trackingStatus);

  let newStatus = 'PENDING'; // Default status
  if (trackingStatuses.every(status => status === 'DELIVERED')) {
    newStatus = 'DELIVERED';
  } else if (trackingStatuses.every(status => status === 'CANCELLED')) {
    newStatus = 'CANCELLED';
  } else if (trackingStatuses.some(status => status === 'SHIPPED')) {
    newStatus = 'SHIPPED';
  }

  // Update the order status
  order.status = newStatus;

  // Save the updated order
  await order.save();

  console.log('Saved order with updated tracking status and overall order status:', order);

  return res.status(200).json(order);  // Return the updated order
};




export const fetchOrderHistory = async (req, res, next) => {
  try {
    // Fetch orders for the logged-in user based on userId
    console.log('userId', req.user.id);
    
    const orders = await Order.find({ user: req.user.id })
      .populate({
        path: 'user',  // Populate the user field to get the address details
        select: 'name email addresses',  // Select the needed user fields
      })
      .populate('items.product', 'name price images');  // Populate the product details for items

    console.log('orders', orders);

    // If no orders found
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this user.' });
    }

    // Send back the orders data
    res.json({ orders });
  } catch (error) {
    next(error);
  }
};




export const listOrders = async (req, res,next) => {
  try {
    // Fetch all orders from the database
    const orders = await Order.find().populate('user').populate('items.product');
    return res.status(200).json(orders); // Return orders in response
  } catch (error) {
   next(error)
  }
};

// Change the status of an order
export const changeOrderStatus = async (req, res, next) => {
  const { orderId, productId } = req.params;
  const { status } = req.body;

  console.log('Received orderId:', orderId); // Debugging log
  console.log('Received productId:', productId); // Debugging log
  console.log('Received status:', status); // Debugging log

  if (!['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status', receivedStatus: status });
  }

  // Fetch the order with populated product details
  const order = await Order.findById(orderId).populate('items.product');
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  console.log('Populated order items:', order.items);  // Log populated order items

  // Find the product in the order using populated _id
  const product = order.items.find(item => item.product._id.toString() === productId);

  if (!product) {
    return res.status(404).json({ message: 'Product not found in the order' });
  }

  // Update the product status
  product.status = status;
  order.markModified('items');  // Mark 'items' as modified

  // If all products in the order are delivered, update the order status
  const allProductsDelivered = order.items.every(item => item.status === 'DELIVERED');
  if (allProductsDelivered) {
    order.status = 'DELIVERED';  // Set the order's status to DELIVERED
  }

  console.log('Updated product status:', product.status);

  await order.save();

  console.log('Saved order:', order);

  return res.status(200).json(order);  // Return the updated order
};



  


// Cancel an order
export const cancelAdminOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).send('Order not found');
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({ message: 'Order cannot be canceled because it is not in the PENDING state' });
    }

    // Ensure the order is not already cancelled
    if (order.status === 'CANCELLED') {
      return res.status(400).send('Order is already cancelled');
    }

    // Restore stock for each item in the order
    for (const item of order.items) {
      const product = await productModel.findById(item.product);
      if (product) {
        const sizeData = product.sizes.find((s) => s.size === item.size);
        if (sizeData) {
          sizeData.stock += item.quantity; // Restore stock
          await product.save();
        }
      }
    }

    // Update the order status to 'CANCELLED'
    order.status = 'CANCELLED';
    await order.save();

    res.status(200).send({ message: 'Order cancelled successfully', order });
  } catch (error) {
    next(error);
  }
};













