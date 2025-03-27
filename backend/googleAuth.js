import { OAuth2Client } from 'google-auth-library';
import userModel from './models/userModel.js';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const client = new OAuth2Client('1063960380483-r5rjuccv61c7pel45o2q864ijbo45t2v.apps.googleusercontent.com');
const allowedOrigins = [
    'http://localhost:5173', // Development frontend
    'http://localhost:5174', // Development frontend (if needed)
    'https://www.mykidzcornor.info', // Production frontend
  ];

export default (app) => {
    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, origin); // Allow the origin
            } else {
                callback(new Error('Not allowed by CORS')); // Block the origin
            }
        },
        credentials: true, // Allow cookies and authorization headers
    }));

    app.post('/google-login', async (req, res) => {
        console.log('Google Login Request Received'); // Log that the request is received
        console.log('Request Body:', req.body); 
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, message: 'Token is missing' });
        }

        console.log('Received token:', token);
        try {
            console.log('Verifying Google token...');
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: '1063960380483-r5rjuccv61c7pel45o2q864ijbo45t2v.apps.googleusercontent.com', // Ensure this matches your Google client ID
            });

            console.log('Google Token Payload:', ticket.getPayload()); // Log the payload to verify the token details

            const payload = ticket.getPayload();
            const { email, name, sub: googleId } = payload;

            // Find user by Google ID
            let user = await userModel.findOne({ googleId });

            if (user) {
                // If user exists, check if they are blocked
                if (user.isBlocked) {
                    return res.status(403).json({ success: false, message: "Your account is blocked. Please contact support." });
                }
            } else {
                // If user doesn't exist, create a new user
                user = await userModel.create({ email, name, googleId });
            }

            // Generate JWT token
            const jwtToken = jwt.sign(
                {id: user._id, googleId: user.googleId, email: user.email, name: user.name },
                process.env.JWT_SECRET || 'kidzcorner',
                { expiresIn: '1h' }
            );

        console.log('JWT Token Generated:', jwtToken);

        return res.json({
            success: true,
            token: jwtToken,
            user: {
              _id: user._id.toString(),
              email: user.email,
              name: user.name,
              googleId: user.googleId,
              role: user.role,
              isBlocked: user.isBlocked,
              isVerified: user.isVerified,
            },
          });
        } catch (error) {
            console.error('Error during Google login:', error); // Log the error details
            return res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    });
};
