const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

// --- GET CONTENT ---
exports.getContent = async (req, res) => {
  try {
    const { role } = req.query;
    const admin = role === 'admin';

    const settings = await prisma.home_settings.findFirst({ orderBy: { id: 'asc' } });
    
    const slideWhere = admin ? {} : { is_active: true };
    const slides = await prisma.home_slides.findMany({ where: slideWhere, orderBy: [{ sort_order: 'asc' }, { id: 'asc' }] });
    
    const lecturerWhere = admin ? {} : { is_active: true };
    const lecturers = await prisma.home_lecturers.findMany({ where: lecturerWhere, orderBy: [{ sort_order: 'asc' }, { id: 'asc' }] });
    
    const timetableWhere = admin ? {} : { is_active: true };
    const timetable = await prisma.home_timetable.findMany({ where: timetableWhere, orderBy: [{ sort_order: 'asc' }, { id: 'asc' }] });

    res.json({
      success: true,
      settings: settings ? {
        heroBadge: settings.hero_badge,
        heroTitle: settings.hero_title,
        heroSubtitle: settings.hero_subtitle,
        primaryCtaLabel: settings.primary_cta_label,
        primaryCtaUrl: settings.primary_cta_url,
        secondaryCtaLabel: settings.secondary_cta_label,
        secondaryCtaUrl: settings.secondary_cta_url,
        coursesHeading: settings.courses_heading,
        coursesSubtitle: settings.courses_subtitle,
        lecturersHeading: settings.lecturers_heading,
        lecturersSubtitle: settings.lecturers_subtitle,
        whyHeading: settings.why_heading,
        whySubtitle: settings.why_subtitle,
        timetableHeading: settings.timetable_heading,
        timetableSubtitle: settings.timetable_subtitle,
        faqHeading: settings.faq_heading
      } : {},
      slides: slides.map(s => ({ ...s, imageUrl: s.image_url, isActive: Boolean(s.is_active), sortOrder: s.sort_order })),
      lecturers: lecturers.map(l => ({ ...l, imageUrl: l.image_url, isActive: Boolean(l.is_active), sortOrder: l.sort_order })),
      timetable: timetable.map(t => ({ 
        ...t, 
        day: t.day_label, 
        time: t.time_label, 
        mode: t.mode_label, 
        isActive: Boolean(t.is_active),
        sortOrder: t.sort_order
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load home content: " + error.message });
  }
};

// --- SETTINGS ---
exports.updateSettings = async (req, res) => {
  try {
    const { 
      hero_title, hero_subtitle, about_title, about_content, about_image,
      features_title, features_subtitle, courses_title, courses_subtitle,
      testimonials_title, testimonials_subtitle, footer_about, footer_address,
      footer_phone, footer_email, facebook_url, twitter_url, instagram_url, linkedin_url
    } = req.body;

    const updateData = {
      hero_title, hero_subtitle, about_title, about_content, about_image,
      features_title, features_subtitle, courses_title, courses_subtitle,
      testimonials_title, testimonials_subtitle, footer_about, footer_address,
      footer_phone, footer_email, facebook_url, twitter_url, instagram_url, linkedin_url
    };

    const first = await prisma.home_settings.findFirst({ orderBy: { id: 'asc' } });
    if (first) {
      await prisma.home_settings.update({ where: { id: first.id }, data: updateData });
    } else {
      await prisma.home_settings.create({ data: updateData });
    }

    res.json({ success: true, message: "Settings saved successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to save settings: " + error.message });
  }
};

// --- SLIDES ---
exports.saveSlide = async (req, res) => {
  try {
    const { id, title, subtitle, image_url, button_text, button_link, sort_order, is_active } = req.body;
    
    if (!title || !image_url) return res.status(400).json({ success: false, message: "Title and Image URL required." });

    const data = {
      title, subtitle: subtitle || null, image_url, button_text: button_text || null,
      button_link: button_link || null, sort_order: sort_order ? parseInt(sort_order) : 0,
      is_active: is_active ? true : false
    };

    if (id) {
      await prisma.home_slides.update({ where: { id: parseInt(id) }, data });
    } else {
      await prisma.home_slides.create({ data });
    }

    res.json({ success: true, message: "Slide saved successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSlide = async (req, res) => {
  try {
    const { id } = req.body;
    await prisma.home_slides.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: "Slide deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- LECTURERS ---
exports.saveLecturer = async (req, res) => {
  try {
    const { id, name, subject, image_url, description, sort_order, is_active } = req.body;
    if (!name || !subject || !image_url) return res.status(400).json({ success: false, message: "Name, Subject, and Image URL required." });

    const data = {
      name, subject, image_url, description: description || null,
      sort_order: sort_order ? parseInt(sort_order) : 0, is_active: is_active ? true : false
    };

    if (id) {
      await prisma.home_lecturers.update({ where: { id: parseInt(id) }, data });
    } else {
      await prisma.home_lecturers.create({ data });
    }

    res.json({ success: true, message: "Lecturer saved successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteLecturer = async (req, res) => {
  try {
    const { id } = req.body;
    await prisma.home_lecturers.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: "Lecturer deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- TIMETABLE ---
exports.saveTimetable = async (req, res) => {
  try {
    const { rowId, id, day, time, title, mode, sortOrder, isActive } = req.body;
    const targetId = rowId || id;
    
    if (!day || !time || !title) {
      return res.status(400).json({ success: false, message: "Day, Time, and Title are required." });
    }

    const data = {
      day_label: day,
      time_label: time,
      title: title,
      mode_label: mode || null,
      sort_order: sortOrder !== undefined ? parseInt(sortOrder) : 0,
      is_active: isActive !== undefined ? Boolean(isActive) : true
    };

    if (targetId) {
      await prisma.home_timetable.update({ where: { id: parseInt(targetId) }, data });
    } else {
      await prisma.home_timetable.create({ data });
    }
    res.json({ success: true, message: "Timetable row saved successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTimetable = async (req, res) => {
  try {
    const { id } = req.body;
    await prisma.home_timetable.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: "Timetable row deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- UPLOAD ---
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file provided." });
    
    const file = req.file;
    const maxSize = 5 * 1024 * 1024; // 5MB limit
    if (file.size > maxSize) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ success: false, message: "File exceeds 5MB." });
    }

    res.json({
      success: true,
      url: `/uploads/home/${file.filename}`,
      message: "File uploaded successfully."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
