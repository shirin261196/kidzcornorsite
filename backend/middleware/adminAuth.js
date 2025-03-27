// adminAuth.js
import jwt from 'jsonwebtoken';

export const adminAuth = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  console.log('Token in header:', token); 

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, please login' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};


