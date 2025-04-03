import userModel from "../models/userModel.js";
import validator from "validator";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendOtpEmail } from '../emailService.js';
import mongoose from "mongoose";
const SECRET_KEY = process.env.JWT_SECRET


// Function to create a JWT token
function generateToken(user) {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
}
// Route for user login
const loginUser = async (req, res,next) => {
    
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await userModel.findOne({ email }); // Use async/await for proper handling
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

   // Check if the user is blocked
   if (user.isBlocked) {
    return res.status(403).json({ success: false, userBlocked: true });
  }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("Stored Password (hashed):", user.password);
console.log("Password from request:", password);
console.log("Password validation result:", isPasswordValid);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // Generate the token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name:user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
    
  


const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists. Please log in.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Hash the OTP before storing
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Store OTP in memory (Fix)
    const userId = new mongoose.Types.ObjectId(); // Generate user ID
    otpStore.set(userId.toString(), { hashedOtp, expiresAt: Date.now() + 5 * 60 * 1000 });

    console.log(`Stored OTP for userId ${userId}:`, otpStore.get(userId.toString())); // Debug log

    // Create new user in the database (unverified)
    const newUser = new userModel({
      _id: userId, // Assign the generated user ID
      name,
      email,
      password: hashedPassword,
      isVerified: false,
    });
    await newUser.save();

    // Send OTP email
    await sendOtpEmail(email, otp);

    res.status(201).json({
      success: true,
      message: 'Account created. OTP sent to your email. Please verify to complete registration.',
      userId: userId.toString(), // Send the generated userId to frontend
    });
  } catch (error) {
    next(error);
  }
};


const otpStore = new Map(); // Temporary in-memory store

// Generate OTP
const generateAndStoreOtp = async (userId) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
    const hashedOtp = await bcrypt.hash(otp, 10); // Hash OTP
    const expiresAt = Date.now() + 5 * 60 * 1000; // Set expiry time (5 min)

    // Store OTP in memory
    otpStore.set(userId, { hashedOtp, expiresAt });

    console.log(`Stored OTP for ${userId}:`, otpStore.get(userId)); // Debug log

    return otp;
  } catch (error) {
    console.error("Error generating OTP:", error);
  }
};


// Verify OTP Route
const verifyOtp = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    // Get OTP data from store
    const data = otpStore.get(userId);
    console.log("Verifying OTP for userId:", userId);
    console.log("Fetched OTP Data:", data);

    // Check if OTP exists and is not expired
    if (!data) {
      return res.json({ success: false, message: "OTP expired or invalid" });
    }

    const { hashedOtp, expiresAt } = data;

    // Check if OTP has expired
    if (Date.now() > expiresAt) {
      console.log("Current Time:", Date.now(), "Expiry Time:", expiresAt);
      otpStore.delete(userId);
      return res.json({ success: false, message: "OTP expired" });
    }

    // Compare provided OTP with stored hashed OTP
    const isValid = await bcrypt.compare(otp, hashedOtp);
    console.log("Validating OTP:", { providedOtp: otp, hashedOtp: data.hashedOtp, isValid });
    if (!isValid) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    // OTP is valid; proceed with user verification
    const user = await userModel.findById(userId);
    if (!user) return res.json({ success: false, message: "User not found" });

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    // Remove OTP from the store
    otpStore.delete(userId);

    res.json({ success: true, message: "Registration successful. You can now log in." });
  } catch (error) {
    next(error);
  }
};


// Resend OTP Route
const resendOtp = async (req, res,next) => {
    try {
        const { email } = req.body;
        console.log("Email received in resendOtp:", email);
        const user = await userModel.findOne({ email });
        if (!user){
          console.error("User not found with email:", email);
        return res.json({ success: false, message: "User not found" });
        }


    // Delete old OTP if exists before generating a new one
    otpStore.delete(user._id.toString());

        const otp = await generateAndStoreOtp(user._id.toString());
        await sendOtpEmail(email, otp);

        res.json({ success: true, message: "OTP resent to your email" });
    } catch (error) {
      next(error);
    }
};

// Forgot Password
const forgotPassword = async (req, res,next) => {
    try {
        const { email } = req.body;
        console.log("Email received in forgotPassword:", email); 
        const user = await userModel.findOne({ email });
        if (!user){
          console.error("User not found with email:", email);
          return res.status(404).json({ success: false, message: "User not found" });
        }

        const otp = await generateAndStoreOtp(user._id.toString());
        await sendOtpEmail(email, otp);

        res.status(200).json({ success: true, message: "OTP sent to your email" });
    } catch (error) {
      next(error);
    }
};

// Reset Password
const resetPassword = async (req, res,next) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const data = otpStore.get(user._id.toString());
        if (!data || Date.now() > data.expiresAt) {
            return res.status(400).json({ success: false, message: "OTP expired or invalid" });
        }

        const isValid = await bcrypt.compare(otp, data.hashedOtp);
        if (!isValid) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        otpStore.delete(user._id.toString());

        res.status(200).json({ success: true, message: "Password reset successful" });
    } catch (error) {
      next(error);
    }
};

// Get User Profile
export const getUserProfile = async (req, res, next) => {
  try {
    console.log('req.user:', req.user); // Debug
    const userId = req.user.id;
    console.log(userId);
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found in request' });
    }

    const user = await userModel.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// Update User Profile
export const updateUserProfile = async (req, res,next) => {
  try {
    const updates = req.body;
    const user = await userModel.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    next(error)
  }
};



// Manage Add Addresses
// Add Address to User Profile
export const addAddress = async (req, res, next) => {
  const { userId, fullname, phone, street, city, state, country, zip } = req.body;
  console.log('Request Body:', req.body);

  if (!userId || !fullname || !phone || !street || !city || !state || !country || !zip) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {

      const user = await userModel.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const newAddress = { fullname, phone, street, city, state, country, zip };
      user.addresses.push(newAddress);
      await user.save();
      const savedAddress = user.addresses[user.addresses.length - 1];
      res.status(201).json({
        success: true,
        message: "Address added successfully",
        address: savedAddress
    });
  } catch (error) {
      next(error);
  }
};







//edit address
export const editAddress = async (req, res, next) => {
  const { addressId } = req.params;
  const { fullname, phone, street, city, state, country, zip } = req.body;

  console.log('updatedaddress',req.body)

  if (!fullname || !phone || !street || !city || !state || !country || !zip) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const addressIndex = user.addresses.findIndex((address) => address._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // Update the address while keeping the original `_id`
    user.addresses[addressIndex] = {
      ...user.addresses[addressIndex],
      fullname,
      phone,
      street,
      city,
      state,
      country,
      zip,
    };

    await user.save();

    res.status(200).json(user.addresses[addressIndex]);
  } catch (error) {
    next(error);
  }
};



export const deleteAddress = async (req, res, next) => {
  const { addressId } = req.params;
  const userId = req.user.id; // Get userId from the authenticated user

  try {
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Find the address to delete
    const addressIndex = user.addresses.findIndex((address) => address._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // Remove the address from the array
    user.addresses.splice(addressIndex, 1);
    await user.save();

    res.status(200).json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    next(error);
  }
};





export const fetchAllAddress = async(req,res,next)=>{
  const userId = req.user.id;  // Authenticated user ID

  try {
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

   // Check if the address exists
   res.status(200).json({ success: true, addresses: user.addresses });
   
  } catch (error) {
    next(error)
  }}




// Admin login route
const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    console.log('Request Body:', req.body);
    console.log('Loaded Admin Email:', process.env.ADMIN_EMAIL);
    console.log('Loaded Admin Password:', process.env.ADMIN_PASSWORD);

    if (email !== process.env.ADMIN_EMAIL) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare plain-text password directly (if not hashed)
    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token for admin
    const token = jwt.sign(
        { userId: process.env.ADMIN_EMAIL, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.json({
      success: true,
      token,
      user: {
          id: 'admin', // Fixed ID for admin
          email: process.env.ADMIN_EMAIL,
          role: 'admin',
      },
  });
};

export { loginUser, registerUser, adminLogin, verifyOtp, resendOtp,forgotPassword,resetPassword };
