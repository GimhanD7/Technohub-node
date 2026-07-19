const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { logActivity } = require('../utils/logger');

// --- ADMIN CRUD ---
exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let whereClause = { status: { not: 'deleted' } };
    if (role && role !== 'all') {
      whereClause.role = role;
    }

    const users = await prisma.users.findMany({
      where: whereClause,
      select: {
        id: true, index_number: true, full_name: true, email: true, phone_number: true,
        role: true, status: true, created_at: true, education_category: true, wallet_balance: true,
        subject: true, experience: true, certifications: true, profile_picture: true
      },
      orderBy: { created_at: 'desc' }
    });
    
    // Ensure decimal properties like wallet_balance are returned as numbers
    const formatted = users.map(u => ({
      ...u,
      wallet_balance: u.wallet_balance ? parseFloat(u.wallet_balance.toString()) : 0
    }));

    res.json({ success: true, users: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addUser = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, role, password, subject, experience, certifications, profilePicture, educationCategory, indexNumber } = req.body;
    
    // Map camelCase to snake_case for existing fields in case some other form uses them
    const mappedEmail = email || req.body.email;
    const mappedFullName = fullName || req.body.full_name;
    const mappedPhone = phoneNumber || req.body.phone;
    const mappedIndex = indexNumber || req.body.index_number;
    
    const existing = await prisma.users.findFirst({ 
      where: { 
        OR: [
          ...(mappedEmail ? [{ email: mappedEmail }] : []),
          ...(mappedIndex ? [{ index_number: mappedIndex }] : []),
          ...(mappedPhone ? [{ phone_number: mappedPhone }] : [])
        ] 
      } 
    });
    
    if (existing) {
      if (mappedEmail && existing.email === mappedEmail) {
        return res.status(400).json({ success: false, message: "Email is already in use." });
      }
      if (mappedPhone && existing.phone_number === mappedPhone) {
        return res.status(400).json({ success: false, message: "Phone number is already in use." });
      }
      if (mappedIndex && existing.index_number === mappedIndex) {
        return res.status(400).json({ success: false, message: "Index number is already in use." });
      }
      return res.status(400).json({ success: false, message: "Email, Phone, or Index Number already in use." });
    }

    const hash = password ? await bcrypt.hash(password, 10) : await bcrypt.hash("password123", 10);
    
    await prisma.users.create({
      data: {
        index_number: mappedIndex || null, 
        full_name: mappedFullName || "Unknown", 
        email: mappedEmail || null, 
        phone_number: mappedPhone || "", 
        role: role || "student",
        password_hash: hash,
        address: "",
        education_category: role === 'student' ? (educationCategory || req.body.education_category || null) : null,
        subject: subject || null,
        experience: experience || null,
        certifications: certifications || null,
        profile_picture: profilePicture || null
      }
    });

    res.json({ success: true, message: "User added successfully." });
  } catch (error) {
    console.error("[addUser Error]:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id, user_id, fullName, full_name, phoneNumber, phone, role, educationCategory, education_category, status, password, admin_id, subject, experience, certifications, profilePicture } = req.body;
    
    const targetId = id || user_id;
    if (!targetId) return res.status(400).json({ success: false, message: "User ID required." });

    const mappedFullName = fullName || full_name;
    const mappedPhone = phoneNumber || phone;
    const mappedEdu = educationCategory || education_category;

    const updateData = { 
      full_name: mappedFullName, 
      phone_number: mappedPhone, 
      role, 
      status, 
      education_category: role === 'student' ? mappedEdu : null,
      subject: subject || null,
      experience: experience || null,
      certifications: certifications || null,
    };
    
    if (profilePicture) updateData.profile_picture = profilePicture;

    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    await prisma.users.update({ where: { id: parseInt(targetId) }, data: updateData });

    if (admin_id) await logActivity(admin_id, 'Updated User', `Updated user ID: ${targetId}`, req);
    res.json({ success: true, message: "User updated successfully." });
  } catch (error) {
    console.error("[updateUser Error]:", error);
    if (error.code === 'P2002') {
      const field = error.meta?.target || "field";
      return res.status(400).json({ success: false, message: `The ${field} is already in use by another user.` });
    }
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id, adminId, password } = req.body;

    if (!adminId || !password) {
      return res.status(400).json({ success: false, message: "Admin confirmation is required for deletion." });
    }

    // Verify admin
    const adminUser = await prisma.users.findUnique({
      where: { id: parseInt(adminId) }
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Unauthorized. Admin privileges required." });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, adminUser.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password. Deletion denied." });
    }

    // Fetch target user details
    const targetUser = await prisma.users.findUnique({
      where: { id: parseInt(id) }
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Insert into deleted_users table for audit logging
    await prisma.deleted_users.create({
      data: {
        original_id: targetUser.id,
        full_name: targetUser.full_name,
        phone_number: targetUser.phone_number,
        email: targetUser.email,
        role: targetUser.role || "student",
        index_number: targetUser.index_number,
        deleted_by: parseInt(adminId)
      }
    });

    // Mark as deleted in users table to preserve foreign key data
    await prisma.users.update({
      where: { id: targetUser.id },
      data: { status: 'deleted' }
    });

    res.json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { id, user_id, status } = req.body;
    const targetId = id || user_id;
    if (!targetId || !status) return res.status(400).json({ success: false, message: "Missing data." });

    await prisma.users.update({
      where: { id: parseInt(targetId) },
      data: { status }
    });
    res.json({ success: true, message: `Account ${status}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.setRole = async (req, res) => {
  try {
    const { id, user_id, role } = req.body;
    const targetId = id || user_id;
    if (!targetId || !role) return res.status(400).json({ success: false, message: "Missing data." });

    await prisma.users.update({
      where: { id: parseInt(targetId) },
      data: { role, education_category: role !== 'student' ? null : undefined }
    });
    res.json({ success: true, message: "Role updated." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- PROFILE ---
exports.updateProfile = async (req, res) => {
  try {
    const { 
      id, fullName, full_name, phoneNumber, phone, email, 
      current_password, new_password, password,
      educationCategory, education_category,
      address, educationInfo, birthdate, subject, experience, certifications 
    } = req.body;
    
    // Support both camelCase from frontend and snake_case
    const actualId = id || (req.user ? req.user.id : null);
    const actualFullName = fullName || full_name;
    const actualPhone = phoneNumber || phone;
    const actualEduCategory = educationCategory || education_category;
    const actualPassword = password || new_password;

    if (!actualId || !actualFullName) {
      return res.status(400).json({ success: false, message: "Required fields missing (id, full_name)." });
    }

    const user = await prisma.users.findUnique({ where: { id: parseInt(actualId) } });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const updateData = { 
      full_name: actualFullName, 
      phone_number: actualPhone, 
    };
    if (email !== undefined) {
      updateData.email = email;
    }
    
    if (user.role === 'student' && actualEduCategory) {
      let mappedEduCategory = actualEduCategory;
      if (mappedEduCategory === 'o/l') mappedEduCategory = 'o_l';
      if (mappedEduCategory === 'a/l') mappedEduCategory = 'a_l';
      updateData.education_category = mappedEduCategory;
    }

    if (address !== undefined) updateData.address = address;
    if (educationInfo !== undefined) updateData.education_info = educationInfo;
    if (birthdate !== undefined) {
      updateData.birthdate = birthdate === "" ? null : new Date(birthdate);
    }
    if (subject !== undefined) updateData.subject = subject;
    if (experience !== undefined) updateData.experience = experience;
    if (certifications !== undefined) updateData.certifications = certifications;

    if (actualPassword) {
      // If current_password is required by UI, check it. But ProfileForm doesn't send current_password.
      // ProfileForm only sends 'password'
      if (current_password) {
         const isMatch = await bcrypt.compare(current_password, user.password_hash);
         if (!isMatch) return res.status(400).json({ success: false, message: "Incorrect current password." });
      }
      updateData.password_hash = await bcrypt.hash(actualPassword, 10);
    }

    await prisma.users.update({ where: { id: parseInt(actualId) }, data: updateData });

    // Fetch refreshed user
    const refreshed = await prisma.users.findUnique({
      where: { id: parseInt(actualId) },
      select: { 
        id: true, index_number: true, full_name: true, email: true, phone_number: true, role: true, 
        profile_picture: true, education_category: true, wallet_balance: true,
        address: true, education_info: true, birthdate: true, subject: true, experience: true, certifications: true
      }
    });

    res.json({ success: true, message: "Profile updated.", user: {
      ...refreshed,
      wallet_balance: refreshed.wallet_balance ? parseFloat(refreshed.wallet_balance.toString()) : 0
    }});
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadProfile = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: "No image provided." });
    req.file = req.files[0]; // Map the first file to req.file

    // Verify token payload to get user ID instead of req.body.id
    // Wait, let's just grab the user from localStorage on frontend...
    // But the backend needs the ID to update the DB!
    // If the frontend isn't sending ID, we have to get it from the token or body.
    let userId = req.body.id;
    if (!userId && req.user) userId = req.user.id;
    if (!userId) return res.status(400).json({ success: false, message: "User ID required. The frontend must send 'id' in the formData." });

    const id = userId;
    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: "Max 5MB." });
    }

    const relativePath = `/uploads/profiles/${req.file.filename}`;
    
    if (id !== 'NEW') {
      // Optional: Delete old avatar
      const oldUser = await prisma.users.findUnique({ where: { id: parseInt(id) } });
      if (oldUser?.profile_picture) {
        try {
          const oldPath = path.resolve(__dirname, '../../../..', oldUser.profile_picture.replace(/^\//, ''));
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (e) {}
      }

      await prisma.users.update({
        where: { id: parseInt(id) },
        data: { profile_picture: relativePath }
      });
    }

    res.json({ success: true, message: "Avatar updated.", imageUrl: relativePath });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDeletedUsers = async (req, res) => {
  try {
    const deletedList = await prisma.deleted_users.findMany({
      orderBy: { deleted_at: 'desc' }
    });
    
    // Resolve deleting admin names
    const admins = await prisma.users.findMany({
      where: { role: 'admin' },
      select: { id: true, full_name: true }
    });
    const adminMap = new Map(admins.map(a => [a.id, a.full_name]));

    const formattedList = deletedList.map(item => ({
      ...item,
      deleted_by_name: adminMap.get(item.deleted_by) || "Admin"
    }));

    res.json({ success: true, deletedUsers: formattedList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
