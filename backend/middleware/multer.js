import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import pkg from 'cloudinary';
const { v2: cloudinary } = pkg;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'product_images', // Folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png','webp'], // Allowed file types
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
   // Max 5MB per file
   dest: 'uploads/',
});

export default upload;
