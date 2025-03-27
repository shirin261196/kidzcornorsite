import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { excelReport, generateReport, pdfReport } from '../controllers/reportController.js';



const reportRouter = express.Router();


reportRouter.get('/generate',generateReport);
reportRouter.get('/download/pdf',pdfReport);
reportRouter.get('/download/excel',excelReport);


export default reportRouter


