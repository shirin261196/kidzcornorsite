import dotenv from 'dotenv';
import express from 'express';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';
import cors from 'cors';

dotenv.config();  // Load environment variables

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware setup
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(bodyParser.json());

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,  // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Store OTPs temporarily (In-memory for demo, use a database in production)
const otpMap = new Map();
const OTP_EXPIRATION_TIME = 5 * 60 * 1000;  // 5 minutes in milliseconds

// Send OTP route
app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  try {
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Store OTP with an expiration time
    otpMap.set(email, { otp, expiresAt: Date.now() + OTP_EXPIRATION_TIME });

    // Send OTP via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
    });

    console.log(`OTP sent to ${email}: ${otp}`);
    res.json({ success: true, message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
});

// Verify OTP route
app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  // Check if OTP exists and is valid
  const storedOtpData = otpMap.get(email);
  if (!storedOtpData || storedOtpData.otp !== parseInt(otp, 10) || storedOtpData.expiresAt < Date.now()) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
  }

  // OTP is valid, remove it from the map
  otpMap.delete(email);

  res.json({ success: true, message: 'OTP verified successfully.' });
});

// Resend OTP route
app.post('/api/resend-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  // Check if an OTP already exists and is still valid
  const storedOtpData = otpMap.get(email);
  if (storedOtpData && storedOtpData.expiresAt > Date.now()) {
    return res.status(400).json({ success: false, message: 'An OTP has already been sent. Please wait for it to expire.' });
  }

  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  otpMap.set(email, { otp, expiresAt: Date.now() + OTP_EXPIRATION_TIME });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
    });

    console.log(`Resent OTP to ${email}: ${otp}`);
    res.json({ success: true, message: 'OTP resent successfully.' });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
