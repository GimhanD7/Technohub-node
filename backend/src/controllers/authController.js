const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateNextIndexNumber } = require('../utils/helpers');
const {
  getEmailError,
  getOtpError,
  getPasswordError,
  getPhoneError,
  normalizeEmail,
  normalizePhoneNumber,
} = require('../utils/validation');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-me';

exports.login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const actualPhoneNumber = normalizePhoneNumber(phoneNumber);

    if (!actualPhoneNumber || !password) {
      return res.status(400).json({ success: false, message: "Invalid input data." });
    }

    const phoneError = getPhoneError(actualPhoneNumber);
    if (phoneError) {
      return res.status(400).json({ success: false, message: phoneError });
    }

    const user = await prisma.users.findUnique({
      where: { phone_number: actualPhoneNumber }
    });

    if (!user) {
      // Log failed attempt here if logger is implemented
      return res.status(401).json({ success: false, message: "Invalid phone number or password." });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: "Your account has been suspended. Please contact the administrator." });
    }

    if (user.status === 'deleted') {
      return res.status(403).json({ success: false, message: "This account has been deleted." });
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
      email,
      address, 
      role = 'student', 
      educationCategory, student_category,
      otp 
    } = req.body;

    const actualFullName = fullName || full_name;
    const actualPhoneNumber = normalizePhoneNumber(phoneNumber || phone_number);
    const actualEmail = normalizeEmail(email);
    const actualStudentCategory = educationCategory || student_category || 'School';

    if (!actualFullName || !actualPhoneNumber || !password || !address || !otp) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const phoneError = getPhoneError(actualPhoneNumber);
    if (phoneError) {
      return res.status(400).json({ success: false, message: phoneError });
    }

    const emailError = getEmailError(actualEmail);
    if (emailError) {
      return res.status(400).json({ success: false, message: emailError });
    }

    const passwordError = getPasswordError(password, { required: true });
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const otpError = getOtpError(otp);
    if (otpError) {
      return res.status(400).json({ success: false, message: otpError });
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

    if (actualEmail) {
      const existingEmail = await prisma.users.findUnique({
        where: { email: actualEmail }
      });

      if (existingEmail) {
        return res.status(409).json({ success: false, message: "Email is already in use." });
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    let mappedEduCategory = actualStudentCategory;
    if (mappedEduCategory === 'o/l') mappedEduCategory = 'o_l';
    if (mappedEduCategory === 'a/l') mappedEduCategory = 'a_l';

    const newIndexNumber = await generateNextIndexNumber();

    const newUser = await prisma.users.create({
      data: {
        index_number: newIndexNumber,
        full_name: actualFullName,
        phone_number: actualPhoneNumber,
        email: actualEmail || null,
        password_hash,
        address,
        role,
        student_category: actualStudentCategory,
        education_category: mappedEduCategory,
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
    const actualPhoneNumber = normalizePhoneNumber(phoneNumber);
    const phoneError = getPhoneError(actualPhoneNumber);
    if (phoneError) return res.status(400).json({ success: false, message: phoneError });

    const existingUser = await prisma.users.findUnique({ where: { phone_number: actualPhoneNumber } });
    if (existingUser) return res.status(400).json({ success: false, message: "Phone number is already registered." });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.otps.upsert({
      where: { phone_number: actualPhoneNumber },
      update: { otp_code: otpCode, expires_at: expiresAt, created_at: new Date() },
      create: { phone_number: actualPhoneNumber, otp_code: otpCode, expires_at: expiresAt }
    });

    console.log(`\n========================================\n[OTP DEBUG] Phone: ${actualPhoneNumber} | Code: ${otpCode}\n========================================\n`);

    // Send SMS via Text.lk API using native Node fetch
    const apiKey = "5699|p87wUERdDtxFnhjHSoIAtovVaGUPQtSfM5LzvZIDf59a80e3";
    let formattedPhone = actualPhoneNumber;
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

exports.sendResetOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const actualPhoneNumber = normalizePhoneNumber(phoneNumber);
    const phoneError = getPhoneError(actualPhoneNumber);
    if (phoneError) return res.status(400).json({ success: false, message: phoneError });

    // Must be an existing user to reset password
    const existingUser = await prisma.users.findUnique({ where: { phone_number: actualPhoneNumber } });
    if (!existingUser) return res.status(404).json({ success: false, message: "No account found with this phone number." });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.otps.upsert({
      where: { phone_number: actualPhoneNumber },
      update: { otp_code: otpCode, expires_at: expiresAt, created_at: new Date() },
      create: { phone_number: actualPhoneNumber, otp_code: otpCode, expires_at: expiresAt }
    });

    console.log(`\n========================================\n[RESET OTP DEBUG] Phone: ${actualPhoneNumber} | Code: ${otpCode}\n========================================\n`);

    // Send SMS via Text.lk API
    const apiKey = "5699|p87wUERdDtxFnhjHSoIAtovVaGUPQtSfM5LzvZIDf59a80e3";
    let formattedPhone = actualPhoneNumber;
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
          message: `Your Techno-Hub password reset OTP is: ${otpCode}. Valid for 5 minutes. Do not share this code.`
        })
      });

      const responseData = await response.json();

      if (response.ok) {
        res.json({ success: true, message: "OTP sent successfully to your phone!" });
      } else {
        console.error("Text.lk API Error:", responseData);
        res.json({
          success: true,
          message: "OTP generated! (SMS gateway error, check server terminal for the code)"
        });
      }
    } catch (fetchError) {
      console.error("SMS Fetch Failed:", fetchError.message);
      res.json({
        success: true,
        message: "OTP generated! (Check backend terminal for the verification code)"
      });
    }
  } catch (error) {
    console.error("sendResetOtp Error:", error);
    res.status(500).json({ success: false, message: "Backend Error: " + error.message });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    const actualPhoneNumber = normalizePhoneNumber(phoneNumber);
    const phoneError = getPhoneError(actualPhoneNumber);
    if (phoneError) return res.status(400).json({ success: false, message: phoneError });
    const otpError = getOtpError(otp);
    if (otpError) return res.status(400).json({ success: false, message: otpError });

    const otpRecord = await prisma.otps.findUnique({ where: { phone_number: actualPhoneNumber } });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "No OTP found for this number. Please request a new code." });
    }

    if (otpRecord.otp_code !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP code. Please try again." });
    }

    if (new Date() > otpRecord.expires_at) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new code." });
    }

    res.json({ success: true, message: "OTP verified successfully. You may now reset your password." });
  } catch (error) {
    console.error("verifyResetOtp Error:", error);
    res.status(500).json({ success: false, message: "Backend Error: " + error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { phoneNumber, otp, newPassword } = req.body;
    const actualPhoneNumber = normalizePhoneNumber(phoneNumber);
    const phoneError = getPhoneError(actualPhoneNumber);
    if (phoneError) return res.status(400).json({ success: false, message: phoneError });
    const otpError = getOtpError(otp);
    if (otpError) return res.status(400).json({ success: false, message: otpError });

    const passwordError = getPasswordError(newPassword, { required: true });
    if (passwordError) return res.status(400).json({ success: false, message: passwordError });

    // Re-verify OTP before allowing password change
    const otpRecord = await prisma.otps.findUnique({ where: { phone_number: actualPhoneNumber } });

    if (!otpRecord || otpRecord.otp_code !== otp) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP. Please restart the process." });
    }

    if (new Date() > otpRecord.expires_at) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please restart the process." });
    }

    // Hash the new password
    const password_hash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.users.update({
      where: { phone_number: actualPhoneNumber },
      data: { password_hash }
    });

    // Clean up OTP record
    try {
      await prisma.otps.delete({ where: { phone_number: actualPhoneNumber } });
    } catch (e) {
      console.error("Failed to delete OTP record after password reset:", e);
    }

    res.json({ success: true, message: "Password reset successfully! You can now login with your new password." });
  } catch (error) {
    console.error("resetPassword Error:", error);
    res.status(500).json({ success: false, message: "Backend Error: " + error.message });
  }
};
