import express from "express";
import { generateInvoice } from "../controllers/invoiceController.js";

const invoiceRouter = express.Router();

invoiceRouter.get("/invoice/:orderId", generateInvoice);

export default invoiceRouter;
