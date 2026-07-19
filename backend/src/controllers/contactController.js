const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- CONTACT MESSAGES ---
exports.submitMessage = async (req, res) => {
  try {
    const { fullName, email, phone, learnerType, subject, message } = req.body;
    
    if (!fullName || !subject || !message) {
      return res.status(400).json({ success: false, message: "Name, subject, and message are required." });
    }

    await prisma.contact_messages.create({
      data: {
        full_name: fullName,
        email: email || null,
        phone: phone || null,
        learner_type: learnerType || null,
        subject,
        message,
        status: 'new'
      }
    });

    res.json({ success: true, message: "Your message has been sent. Our team will contact you soon." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send message: " + error.message });
  }
};

exports.listMessages = async (req, res) => {
  try {
    const messages = await prisma.contact_messages.findMany({
      orderBy: { created_at: 'desc' }
    });
    
    const mapped = messages.map(m => ({
      id: m.id,
      fullName: m.full_name,
      email: m.email,
      phone: m.phone,
      learnerType: m.learner_type,
      subject: m.subject,
      message: m.message,
      status: m.status,
      createdAt: m.created_at.toISOString()
    }));
    
    res.json({ success: true, messages: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMessageStatus = async (req, res) => {
  try {
    const { messageId, status, role } = req.body;
    
    if (role !== 'admin') {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    if (!['new', 'read', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    await prisma.contact_messages.update({
      where: { id: parseInt(messageId) },
      data: { status }
    });

    res.json({ success: true, message: "Status updated." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId, role } = req.body;
    
    if (role !== 'admin') {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    await prisma.contact_messages.delete({
      where: { id: parseInt(messageId) }
    });
    res.json({ success: true, message: "Message deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- CONTACT SETTINGS ---
exports.getSettings = async (req, res) => {
  try {
    let settings = await prisma.contact_settings.findUnique({ where: { id: 1 } });
    if (!settings) {
      res.json({
        success: true,
        settings: {
          heroBadge: "Student Support Desk",
          title: "Contact Techno-Hub",
          subtitle: "", phone: "", whatsapp: "", email: "", address: "", officeHours: "",
          mapUrl: "", facebookUrl: "", instagramUrl: "", linkedinUrl: "", youtubeUrl: "",
          primaryCtaLabel: "", primaryCtaUrl: ""
        }
      });
    } else {
      res.json({
        success: true,
        settings: {
          heroBadge: settings.hero_badge,
          title: settings.title,
          subtitle: settings.subtitle,
          phone: settings.phone,
          whatsapp: settings.whatsapp,
          email: settings.email,
          address: settings.address,
          officeHours: settings.office_hours,
          mapUrl: settings.map_url,
          facebookUrl: settings.facebook_url,
          instagramUrl: settings.instagram_url,
          linkedinUrl: settings.linkedin_url,
          youtubeUrl: settings.youtube_url,
          primaryCtaLabel: settings.primary_cta_label,
          primaryCtaUrl: settings.primary_cta_url
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { role, ...data } = req.body;
    if (role !== 'admin') {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    const {
      heroBadge, title, subtitle, phone, whatsapp, email, address, officeHours,
      mapUrl, facebookUrl, instagramUrl, linkedinUrl, youtubeUrl, primaryCtaLabel, primaryCtaUrl, userId
    } = data;

    if (!heroBadge || !title) {
      return res.status(400).json({ success: false, message: "Badge and title are required." });
    }

    const updateData = {
      hero_badge: heroBadge, title, subtitle, phone, whatsapp, email, address, office_hours: officeHours,
      map_url: mapUrl, facebook_url: facebookUrl, instagram_url: instagramUrl, linkedin_url: linkedinUrl, 
      youtube_url: youtubeUrl, primary_cta_label: primaryCtaLabel, primary_cta_url: primaryCtaUrl,
      updated_by: userId ? parseInt(userId) : null
    };

    const settings = await prisma.contact_settings.upsert({
      where: { id: 1 },
      update: updateData,
      create: { id: 1, ...updateData }
    });

    res.json({ 
      success: true, 
      message: "Contact page details updated successfully.", 
      settings: {
        heroBadge: settings.hero_badge,
        title: settings.title,
        subtitle: settings.subtitle,
        phone: settings.phone,
        whatsapp: settings.whatsapp,
        email: settings.email,
        address: settings.address,
        officeHours: settings.office_hours,
        mapUrl: settings.map_url,
        facebookUrl: settings.facebook_url,
        instagramUrl: settings.instagram_url,
        linkedinUrl: settings.linkedin_url,
        youtubeUrl: settings.youtube_url,
        primaryCtaLabel: settings.primary_cta_label,
        primaryCtaUrl: settings.primary_cta_url
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update contact details: " + error.message });
  }
};
