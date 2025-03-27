import express from 'express';
import moment from 'moment';

import PDFKit from 'pdfkit';
import ExcelJS from 'exceljs';

import Order from '../models/orderModel.js';
import productModel from '../models/productModel.js';
import Transaction from '../models/transactionSchema.js';
const router = express.Router();

const calculateTotals = (orders) => {
    let totalSales = 0;
    let totalOrders = orders.length;
    let totalDiscount = 0;
  
    orders.forEach(order => {
      totalSales += order.finalPrice;
      totalDiscount += order.discountAmount;
    });
  
    return { totalSales, totalOrders, totalDiscount };
  };

export const generateReport = async (req, res, next) => {
    try {
        const { startDate, endDate, filter } = req.query;
    
        let filterQuery = {};
    
        // Filter by custom date range
        if (startDate && endDate) {
          filterQuery.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          };
        }
    
        // Filter by day/week/month
        if (filter === 'daily') {
          filterQuery.createdAt = {
            $gte: new Date().setHours(0, 0, 0, 0),
            $lte: new Date().setHours(23, 59, 59, 999),
          };
        } else if (filter === 'weekly') {
          const today = new Date();
          const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
          const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
          filterQuery.createdAt = {
            $gte: firstDayOfWeek,
            $lte: lastDayOfWeek,
          };
        } else if (filter === 'monthly') {
          const today = new Date();
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          filterQuery.createdAt = {
            $gte: firstDayOfMonth,
            $lte: lastDayOfMonth,
          };
        }
    
        // Fetch orders
        const orders = await Order.find(filterQuery).populate('user items.product');
    
        // Calculate totals
        const { totalSales, totalOrders, totalDiscount } = calculateTotals(orders);
    
        // Fetch transactions
        const transactions = await Transaction.find({
          orderId: { $in: orders.map(order => order._id) },
        });
    
        res.status(200).json({
          success: true,
          data: {
            orders,
            totalSales,
            totalOrders,
            totalDiscount,
            transactions,
          },
        });
      } catch (error) {
        next(error)
      }
};


// Download Report as PDF
export const pdfReport= async (req, res,next) => {
    try {
        const { startDate, endDate } = req.query;
    
        // Validate startDate and endDate
        if (!startDate || !endDate) {
          return res.status(400).json({ success: false, message: 'Both startDate and endDate are required' });
        }
    
        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);
    
        if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
          return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
        }
    
        // Query orders based on the date range
        const orders = await Order.find({
          createdAt: {
            $gte: parsedStartDate,
            $lte: parsedEndDate,
          },
        }).populate('user items.product');

    const doc = new PDFKit();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');

    doc.text('Sales Report', { align: 'center', fontSize: 20 });
    doc.text(`Date Range: ${startDate} to ${endDate}\n\n`);
    doc.text('Order Details:\n');

    orders.forEach(order => {
      doc.text(`Order ID: ${order._id}`);
      doc.text(`Total Price: ${order.totalPrice}`);
      doc.text(`Final Price: ${order.finalPrice}`);
      doc.text(`Discount: ${order.discountAmount}`);
      doc.text('-----');
    });

    doc.pipe(res);
    doc.end();
  } catch (error) {
   next(error)
  }
};

// Download Report as Excel
export const excelReport = async (req, res,next) => {
    try {
        const { startDate, endDate } = req.query;
    
        // Validate startDate and endDate
        if (!startDate || !endDate) {
          return res.status(400).json({ success: false, message: 'Both startDate and endDate are required' });
        }
    
        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);
    
        if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
          return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
        }
    
        // Query orders based on the date range
        const orders = await Order.find({
          createdAt: {
            $gte: parsedStartDate,
            $lte: parsedEndDate,
          },
        }).populate('user items.product');
    
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Sales Report');
    
        // Add headers
        sheet.columns = [
          { header: 'Order ID', key: 'orderId', width: 25 },
          { header: 'Total Price', key: 'totalPrice', width: 15 },
          { header: 'Final Price', key: 'finalPrice', width: 15 },
          { header: 'Discount', key: 'discount', width: 15 },
        ];
    
        // Add rows
        orders.forEach(order => {
          sheet.addRow({
            orderId: order._id,
            totalPrice: order.totalPrice,
            finalPrice: order.finalPrice,
            discount: order.discountAmount,
          });
        });
    
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
    
        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        next(error)
      }
  };
  

export default router;
