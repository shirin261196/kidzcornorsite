import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Order from "../models/orderModel.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoice = async (req, res,next) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId).populate("user").populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

     // Define invoices directory
     const invoicesDir = path.join(__dirname, "../invoices");

     // Check if the directory exists, if not, create it
     if (!fs.existsSync(invoicesDir)) {
       fs.mkdirSync(invoicesDir, { recursive: true });
     }
 
     const invoicePath = path.join(invoicesDir, `invoice-${orderId}.pdf`);
 
     const doc = new PDFDocument({ margin: 50 });
     doc.pipe(fs.createWriteStream(invoicePath));
     doc.pipe(res);

    //      // Load company logo
    // const logoPath = path.join(__dirname, "../../frontend/src/assets/Logo.webp");
    // if (fs.existsSync(logoPath)) {
    //   doc.image(logoPath, 50, 50, { width: 100 });
    // }


    // Header
    doc.fontSize(20).text("INVOICE", { align: "center" });
    doc.moveDown();

    // Order Details
    doc.fontSize(14).text(`Order ID: ${order._id}`);
    doc.text(`Customer: ${order.user.name}`);
    doc.text(`Email: ${order.user.email}`);
    doc.text(`Date: ${order.createdAt.toDateString()}`);
    doc.moveDown();

     // Address Details
     doc.text("Shipping Address:", { underline: true });
     doc.text(`${order.address.fullname}`);
     doc.text(`${order.address.street}, ${order.address.city}`);
     doc.text(`${order.address.state}, ${order.address.zip}, ${order.address.country}`);
     doc.text(`Phone: ${order.address.phone}`);
     doc.moveDown();

      // Draw a separator line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown();

        // Table Header
    doc.font("Helvetica-Bold");
   // Adjust column widths
    const startX = 50;
    let startY = doc.y + 10;

    doc.text("S.No", startX, startY, { width: 40, align: "center" });
    doc.text("Product", startX + 50, startY, { width: 200, align: "left" });
    doc.text("Qty", startX + 260, startY, { width: 50, align: "center" });
    doc.text("Price", startX + 320, startY, { width: 80, align: "right" });
    doc.text("Total", startX + 420, startY, { width: 80, align: "right" });
    
    doc.moveDown().font("Helvetica");


    // Separator Line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(0.5);
  // Table Rows
  order.items.forEach((item, index) => {
    startY = doc.y + 5;
    doc.text(`${index + 1}`, startX, startY, { width: 40, align: "center" });
    doc.text(item.product.name, startX + 50, startY, { width: 200, align: "left" });
    doc.text(item.quantity.toString(), startX + 260, startY, { width: 50, align: "center" });
    doc.text(`Rs.${item.product.price}`, startX + 320, startY, { width: 80, align: "right" });
    doc.text(`Rs.${item.product.price * item.quantity}`, startX + 420, startY, { width: 80, align: "right" });

    doc.moveDown();
  });

// Draw another separator line
doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1.5);

// Price Summary

   // Price Details Box
   let priceX = 350;
   let priceY = doc.y + 10;
   
   doc.fontSize(14).font("Helvetica-Bold").text("Price Details:", priceX, priceY);
   doc.moveDown(0.5).fontSize(12).font("Helvetica");

   doc.text(`Subtotal: Rs.${order.totalPrice}`, priceX, doc.y, { align: "right" });
   doc.text(`Discount: -Rs.${order.discountAmount}`, priceX, doc.y, { align: "right" });
   doc.text(`Final Price: Rs.${order.finalPrice}`, priceX, doc.y, { align: "right", bold: true });
   doc.moveDown(2);



  // Footer
  doc.moveTo(50, 750).lineTo(550, 750).stroke();
  doc.fontSize(12).text("Thank you for your purchase!", { align: "center" });

    doc.end();
  } catch (error) {
    console.error(error);
  next(error)
  }
};
