const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logActivity } = require('../utils/logger');
const {
  getEmailError,
  getPhoneError,
  normalizeEmail,
  normalizePhoneNumber,
} = require('../utils/validation');

exports.getSettings = async (req, res) => {
  try {
    const settings = await prisma.system_settings.findFirst({ orderBy: { id: 'asc' } });
    res.json({ success: true, settings: settings || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { 
      site_title, contact_email, contact_phone, address, 
      currency, default_commission, max_upload_size, admin_id 
    } = req.body;
    const normalizedEmail = normalizeEmail(contact_email);
    const normalizedPhone = normalizePhoneNumber(contact_phone);
    const emailError = getEmailError(normalizedEmail);
    if (emailError) return res.status(400).json({ success: false, message: emailError });
    if (normalizedPhone) {
      const phoneError = getPhoneError(normalizedPhone);
      if (phoneError) return res.status(400).json({ success: false, message: phoneError });
    }

    const data = {
      site_title, contact_email: normalizedEmail, contact_phone: normalizedPhone, address,
      currency, default_commission: parseFloat(default_commission), 
      max_upload_size: parseInt(max_upload_size)
    };

    const existing = await prisma.system_settings.findFirst({ orderBy: { id: 'asc' } });

    if (existing) {
      await prisma.system_settings.update({ where: { id: existing.id }, data });
    } else {
      await prisma.system_settings.create({ data });
    }

    if (admin_id) await logActivity(admin_id, 'Updated System Settings', '', req);
    res.json({ success: true, message: "Settings updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
