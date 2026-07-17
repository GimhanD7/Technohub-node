const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-me';

exports.login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({ success: false, message: "Invalid input data." });
    }

    const user = await prisma.users.findUnique({
      where: { phone_number: phoneNumber }
    });

    if (!user) {
      // Log failed attempt here if logger is implemented
      return res.status(401).json({ success: false, message: "Invalid phone number or password." });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: "Your account has been suspended. Please contact the administrator." });
    }

    // Compare with bcrypt (compatible with PHP password_hash)
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid phone number or password." });
    }

    // Log success here if logger is implemented

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, phone_number: user.phone_number },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password_hash from response
    delete user.password_hash;

    res.json({
      success: true,
      message: `Welcome back, ${user.full_name}!`,
      token,
      user
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "An error occurred." });
  }
};

exports.register = async (req, res) => {
  try {
    const { 
      fullName, full_name, 
      phoneNumber, phone_number, 
      password, 
      address, 
      role = 'student', 
      educationCategory, student_category,
      otp 
    } = req.body;

    const actualFullName = fullName || full_name;
    const actualPhoneNumber = phoneNumber || phone_number;
    const actualStudentCategory = educationCategory || student_category || 'School';

    if (!actualFullName || !actualPhoneNumber || !password || !address || !otp) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // 1. Verify OTP
    const otpRecord = await prisma.otps.findUnique({
      where: { phone_number: actualPhoneNumber }
    });

    if (!otpRecord || otpRecord.otp_code !== otp) {
      return res.status(400).json({ success: false, message: "Invalid verification code." });
    }

    if (new Date() > otpRecord.expires_at) {
      return res.status(400).json({ success: false, message: "Verification code has expired." });
    }

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { phone_number: actualPhoneNumber }
    });

    if (existingUser) {
      return res.status(409).json({ success: false, message: "Phone number already exists." });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await prisma.users.create({
      data: {
        full_name: actualFullName,
        phone_number: actualPhoneNumber,
        password_hash,
        address,
        role,
        student_category: actualStudentCategory,
        status: 'active'
      }
    });

    // Delete OTP record on successful registration
    try {
      await prisma.otps.delete({ where: { phone_number: actualPhoneNumber } });
    } catch (e) {
      console.error("Failed to delete OTP record:", e);
    }

    delete newUser.password_hash;

    res.json({
      success: true,
      message: "Registration successful. Please login.",
      user: newUser
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: "Registration failed." });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: "Phone number is required." });

    const existingUser = await prisma.users.findUnique({ where: { phone_number: phoneNumber } });
    if (existingUser) return res.status(400).json({ success: false, message: "Phone number is already registered." });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.otps.upsert({
      where: { phone_number: phoneNumber },
      update: { otp_code: otpCode, expires_at: expiresAt, created_at: new Date() },
      create: { phone_number: phoneNumber, otp_code: otpCode, expires_at: expiresAt }
    });

    console.log(`\n========================================\n[OTP DEBUG] Phone: ${phoneNumber} | Code: ${otpCode}\n========================================\n`);

    // Send SMS via Text.lk API using native Node fetch
    const apiKey = "5699|p87wUERdDtxFnhjHSoIAtovVaGUPQtSfM5LzvZIDf59a80e3";
    let formattedPhone = phoneNumber;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '94' + formattedPhone.substring(1);
    }

    try {
      const response = await fetch('https://app.text.lk/api/v3/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          recipient: formattedPhone,
          sender_id: 'AITI',
          type: 'plain',
          message: "Your Techno-Hub registration OTP is: " + otpCode + ". Valid for 5 minutes."
        })
      });

      const responseData = await response.json();

      if (response.ok) {
        res.json({ success: true, message: "OTP sent successfully!" });
      } else {
        console.error("Text.lk API Error:", responseData);
        // Fallback in case of API failure so dev isn't blocked
        res.json({ 
          success: true, 
          message: "OTP generated! (SMS gateway error, please check server terminal for the code)" 
        });
      }
    } catch (fetchError) {
      console.error("SMS Fetch Failed (Gateway offline or invalid URL):", fetchError.message);
      // Fallback in case of network error (like ENOTFOUND) so dev isn't blocked
      res.json({ 
        success: true, 
        message: "OTP generated! (Check backend terminal for the verification code)" 
      });
    }
  } catch (error) {
    console.error("OTP Error:", error);
    res.status(500).json({ success: false, message: "Backend Error: " + error.message });
  }
};
