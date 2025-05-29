import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendEmail } from "../services/emailService.js";
import crypto from "crypto";
import dotenv from "dotenv";
import ContactMessage from "../models/Contact.js";
import mongoose from "mongoose";


dotenv.config();

global.otpStore = {};

class AuthController {
  async register(req, res) {
    try {
      const { email, password, role, firstName, lastName, mobileNumber } =
        req.body;
      const profilePic = req.file ? req.file.path : "";

      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: "User already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({
        email,
        password: hashedPassword,
        role,
        firstName,
        lastName,
        profilePic,
        mobileNumber,
      });

      await sendEmail(
        email,
        "Farm IT - Registration Successful",
        `<p><strong>Dear ${firstName} ${lastName},</strong></p>
        <p>Your account has been successfully registered.</p>
        <p><strong>Admin verification takes 2 days.</strong> Once verified, you will receive another email notification, and then you can log in.</p>
        <p>Thank you for your patience.</p>
        <p><strong>Best Regards,</strong><br>Farm IT Team</p>`
      );

      await user.save();

      res.json({
        message:
          "Registration successful. Please check your email for OTP verification.",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }

  async sendOtp(req, res) {
    try {
      const { email } = req.body;

      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      if (global.otpStore[email]) {
        const { otp, timestamp } = global.otpStore[email];
        const currentTime = Date.now();
        const expiryTime = 2 * 60 * 1000;

        if (currentTime - timestamp < expiryTime) {
          return res
            .status(400)
            .json({ message: "OTP already sent. Please verify it." });
        }
      }

      const otp = crypto.randomInt(100000, 999999).toString();
      const timestamp = Date.now();
      global.otpStore[email] = { otp, timestamp };

      const otpMessage = `
        Farm IT - Email Verification Process
        <p>Dear <b>${user.firstName} ${user.lastName}</b>,</p>
        <p>Your OTP for Login is <strong>${otp}</strong>.</p>
        <p>This OTP will remain valid for 2 minutes until you verify it.</p>`;

      await sendEmail(email, "Your OTP for Login", otpMessage);

      res.json({ message: "OTP sent successfully. Please check your email." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password, otp } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid Email" });
      }

      if (["farmer", "investor"].includes(user.role) && !user.isVerified) {
        return res
          .status(400)
          .json({ message: "Admin has to verify your account" });
      }

      if (password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: "Invalid Password" });
        }

        const token = jwt.sign(
          { userId: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );

        return res.json({ token, role: user.role });
      }

      if (otp) {
        const otpData = global.otpStore[email];
        if (!otp || otp !== otpData.otp) {
          return res.status(400).json({ message: "Invalid OTP" });
        }

        const currentTime = Date.now();
        const expiryTime = 2 * 60 * 1000;

        if (currentTime - otpData.timestamp > expiryTime) {
          delete global.otpStore[email];
          return res.status(400).json({ message: "OTP has expired" });
        }

        const token = jwt.sign(
          { userId: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );

        delete global.otpStore[email];
        return res.json({ token, role: user.role });
      }

      await sendEmail(user.email);
      return res.status(200).json({ message: "OTP sent to your email." });
    } catch (err) {
      console.error("Server error:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }

  async sendContactMessage(req, res) {
    try {
      const { subject, message } = req.body;
      const userId = req.params.id;
  
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
  
      if (!subject || !message) {
        return res.status(400).json({ message: "Subject and message are required." });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const newMessage = new ContactMessage({
        userId,
        subject,
        message,
      });
  
      await newMessage.save();
  
      await sendEmail(
        user.email,
        `📬 Farm IT - Message Received: ${subject}`,
        `<div style="font-family: Arial, sans-serif; color: #0d6efd;">
          <p><strong>Dear ${user.firstName} ${user.lastName},</strong></p>
          <p>We have received your message regarding <strong>"${subject}"</strong>.</p>
          <p>Our support team will get back to you shortly.</p>
          <p><strong>Your Message:</strong><br>${message}</p>
          <br>
          <p><strong>Best Regards,</strong><br>Farm IT Support Team</p>
        </div>`
      );
      
      res.json({
        message: "✅ Your message has been sent successfully. Please check your email for confirmation.",
      });
  
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
  
  
  
}

export default AuthController;
