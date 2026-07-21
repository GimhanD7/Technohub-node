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
        faqHeading: settings.faq_heading,
        aitiDescription: settings.aiti_description,
        aitiLogo: settings.aiti_logo,
        aitiLogoWidth: settings.aiti_logo_width,
        aitiLogoHeight: settings.aiti_logo_height,
        aitiDescriptionBold: settings.aiti_description_bold
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
      heroBadge, heroTitle, heroSubtitle, primaryCtaLabel, primaryCtaUrl,
      secondaryCtaLabel, secondaryCtaUrl, coursesHeading, coursesSubtitle,
      lecturersHeading, lecturersSubtitle, whyHeading, whySubtitle,
      timetableHeading, timetableSubtitle, faqHeading, aitiDescription, aitiLogo,
      aitiLogoWidth, aitiLogoHeight, aitiDescriptionBold, userId
    } = req.body;

    const logoWidth = Number(aitiLogoWidth ?? 120);
    const logoHeight = Number(aitiLogoHeight ?? 44);

    if (!Number.isInteger(logoWidth) || logoWidth < 20 || logoWidth > 500) {
      return res.status(400).json({ success: false, message: "AITI logo width must be between 20 and 500 pixels." });
    }
    if (!Number.isInteger(logoHeight) || logoHeight < 20 || logoHeight > 300) {
      return res.status(400).json({ success: false, message: "AITI logo height must be between 20 and 300 pixels." });
    }
    if (aitiDescriptionBold !== undefined && typeof aitiDescriptionBold !== 'boolean') {
      return res.status(400).json({ success: false, message: "AITI description bold setting is invalid." });
    }

    const updateData = {
      hero_badge: heroBadge,
      hero_title: heroTitle,
      hero_subtitle: heroSubtitle,
      primary_cta_label: primaryCtaLabel,
      primary_cta_url: primaryCtaUrl,
      secondary_cta_label: secondaryCtaLabel,
      secondary_cta_url: secondaryCtaUrl,
      courses_heading: coursesHeading,
      courses_subtitle: coursesSubtitle,
      lecturers_heading: lecturersHeading,
      lecturers_subtitle: lecturersSubtitle,
      why_heading: whyHeading,
      why_subtitle: whySubtitle,
      timetable_heading: timetableHeading,
      timetable_subtitle: timetableSubtitle,
      faq_heading: faqHeading,
      aiti_description: aitiDescription,
      aiti_logo: aitiLogo,
      aiti_logo_width: logoWidth,
      aiti_logo_height: logoHeight,
      aiti_description_bold: aitiDescriptionBold ?? false,
      updated_by: userId ? parseInt(userId) : null
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
    const { slideId, title, label, imageUrl, sortOrder, isActive } = req.body;
    
    if (!title || !imageUrl) return res.status(400).json({ success: false, message: "Title and Image URL required." });

    const data = {
      title, 
      label: label || null, 
      image_url: imageUrl, 
      sort_order: sortOrder ? parseInt(sortOrder) : 0,
      is_active: isActive === undefined ? true : Boolean(isActive)
    };

    if (slideId) {
      await prisma.home_slides.update({ where: { id: parseInt(slideId) }, data });
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
    const id = req.body.id || req.body.slideId;
    if (!id) return res.status(400).json({ success: false, message: "Slide ID is required." });
    await prisma.home_slides.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: "Slide deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- LECTURERS ---
exports.saveLecturer = async (req, res) => {
  try {
    const { lecturerId, name, subject, focus, imageUrl, initials, sortOrder, isActive } = req.body;
    if (!name || !subject || !imageUrl) return res.status(400).json({ success: false, message: "Name, Subject, and Image URL required." });

    const data = {
      name, subject, image_url: imageUrl, focus: focus || null, initials: initials || null,
      sort_order: sortOrder ? parseInt(sortOrder) : 0, is_active: isActive === undefined ? true : Boolean(isActive)
    };

    if (lecturerId) {
      await prisma.home_lecturers.update({ where: { id: parseInt(lecturerId) }, data });
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
    const id = req.body.id || req.body.lecturerId;
    if (!id) return res.status(400).json({ success: false, message: "Lecturer ID is required." });
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
    const id = req.body.id || req.body.rowId;
    if (!id) return res.status(400).json({ success: false, message: "Timetable row ID is required." });
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
