import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectDB from './config/mongodb.js';
import userRouter from './routes/userRoute.js';
import productRouter from './routes/productRoute.js';
import adminRouter from './routes/adminRoutes.js';
import categoryRouter from './routes/categoryRoutes.js';
import pkg from 'cloudinary'; // Import Cloudinary
import googleAuth from './googleAuth.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import cartRouter from './routes/cartRoutes.js';
import orderRouter from './routes/orderRoutes.js';
import addressRouter from './routes/addressRoutes.js';
import offerRouter from './routes/offerRoutes.js';
import couponRouter from './routes/couponRoutes.js';
import reportRouter from './routes/reportRoutes.js';
import wishlistRouter from './routes/wishlistRoutes.js';
import walletRouter from './routes/walletRouter.js';
import payRouter  from './routes/walletpayRoutes.js';
import invoiceRouter from './routes/invoiceRoute.js';
import bestRouter from './routes/topTenroutes.js';
const { v2: cloudinary } = pkg;


// Load environment variables
dotenv.config();

// Initialize Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary Config Initialized');

// App Config
const app = express();
// Middlewares

const allowedOrigins = [
  'http://localhost:5173', // Development frontend
  'http://localhost:5174', // Development frontend (if needed)
 'https://mykidzcornor.info',
  'https://www.mykidzcornor.info', // Production frontend
];

app.use(cors({
  origin: (origin, callback) => {
console.log(`Request Origin: ${origin}`); // Log the origin for debugging
    console.log(`Allowed Origins: ${allowedOrigins}`);
    if (!origin) {
      // Allow requests without an origin (e.g., Postman or server-to-server calls)
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
console.log(`Origin ${origin} is allowed`);
      callback(null, origin); // Reflect the origin in the response
    } else {
console.warn(`🚨 CORS Blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow credentials like cookies and tokens
 methods : ['GET','POST','PUT','DELETE','PATCH','OPTIONS'], // Allow common HTTP methods
  allowedHeaders: ['Content-Type,Authorization'], 
}));

// Explicitly handle CORS preflight requests for all routes
app.options('*', cors({
  origin: (origin, callback) => {
    console.log(`Handling OPTIONS request from origin: ${origin}`);
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      console.warn(`🚨 CORS Blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 4000;
connectDB();



googleAuth(app);
// Mount routes
app.use('/', userRouter); // For user-related routes
app.use('/admin', adminRouter); // For admin-related routes

// The product route needs multer's fields handling for file uploads
app.use('/admin/products', productRouter);

 // For product-related routes

app.use('/admin/category', categoryRouter); // For category-related routes

app.use('/user',cartRouter);
app.use('/products',bestRouter);

app.use('/',orderRouter);

app.use('/user',addressRouter)
app.use('/admin/offers',offerRouter)
app.use('/',couponRouter)

app.use('/api/reports',reportRouter)
app.use('/user',wishlistRouter)
app.use('/user',walletRouter)
app.use('/wallet',payRouter)
app.use("/api", invoiceRouter);

app.get('/', (req, res) => {
    res.send('Server is running!');
});

app.use(errorMiddleware);

app.listen(port, () => console.log(`Server started on PORT: ${port}`));
