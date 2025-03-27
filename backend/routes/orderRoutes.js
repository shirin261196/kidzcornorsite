import express from 'express';
import { approveReturn, cancelAdminOrder, cancelOrder,  changeOrderStatus, changeTrackingStatus, createOrder,fetchOrderHistory,getWalletBalance,listOrders, paymentFailed, processRefund, requestReturn, retryPayment, verifyPayment} from '../controllers/orderController.js';
import { userAuth } from '../middleware/userAuth.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { handlePaymentFailure, razorpayWebhook} from '../controllers/paymentFailure.js';
import { exportLedgerCSV, getLedgerReport } from '../controllers/ledgerController.js';





const orderRouter = express.Router();

orderRouter.post("/user/orders/create",userAuth, createOrder);
// orderRouter.post("/user/orders/confirm",userAuth,confirmPayment);
orderRouter.get("/user/orders", userAuth,fetchOrderHistory);
orderRouter.get('/user/wallet/balance',userAuth,getWalletBalance)
orderRouter.delete('/user/orders/:orderId',userAuth, cancelOrder)
orderRouter.post('/user/orders/payment-failed', paymentFailed);
orderRouter.post('/user/retry-payment', retryPayment);
orderRouter.post('/payments/webhook', razorpayWebhook);
orderRouter.put('/user/orders/:orderId/return',userAuth, requestReturn);
orderRouter.post('/user/orders/verify-payment', verifyPayment);
//admin routes
orderRouter.get('/admin/orders',adminAuth,listOrders)
orderRouter.patch('/admin/orders/:orderId/status',adminAuth,changeOrderStatus)
orderRouter.put('/admin/orders/:orderId/item/:productId/tracking-status',adminAuth, changeTrackingStatus);
orderRouter.delete('/admin/orders/:orderId',adminAuth, cancelAdminOrder)
orderRouter.put('/admin/orders/:orderId/items/:itemId/approve-return',adminAuth, approveReturn)
orderRouter.post('/admin/orders/:orderId/process-refund',userAuth,processRefund);
orderRouter.get('/admin/ledgerreport',adminAuth,getLedgerReport)
orderRouter.get('/admin/export-ledger-csv',adminAuth,exportLedgerCSV)


export default orderRouter;

