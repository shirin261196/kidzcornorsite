import jwt from 'jsonwebtoken';

export const userAuth = (req, res, next) => {
  try {
    // Extract the Authorization header
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists and is properly formatted
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided or invalid format' });
    }

    // Extract the token from the Authorization header
    const token = authHeader.split(' ')[1];

    // Verify the token using your secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user details to the request object for further use
    req.user = decoded;
    console.log(req.user)
    next(); // Move to the next middleware
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }

    // Handle other errors
    return res.status(500).json({ success: false, message: 'Authentication failed', error: error.message });
  }
};


