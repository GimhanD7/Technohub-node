const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

exports.listGallery = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20, role } = req.query;
    
    let whereClause = {};
    if (search) {
      whereClause.title = { contains: search };
    }
    if (category) {
      whereClause.category = category;
    }
    if (role !== 'admin') {
      whereClause.is_published = true;
    }

    const total = await prisma.gallery_items.count({ where: whereClause });
    const items = await prisma.gallery_items.findMany({
      where: whereClause,
      include: {
        gallery_images: {
          orderBy: { sort_order: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const totalPages = Math.ceil(total / parseInt(limit));
    
    // Map snake_case to camelCase for the frontend
    const mappedItems = items.map(item => ({
      id: item.id,
      title: item.title,
      entryType: item.entry_type,
      category: item.category,
      eventDate: item.event_date ? item.event_date.toISOString() : null,
      location: item.location,
      summary: item.summary,
      details: item.details,
      imageUrl: item.image_url,
      ctaLabel: item.cta_label,
      ctaUrl: item.cta_url,
      isFeatured: Boolean(item.is_featured),
      isPublished: Boolean(item.is_published),
      createdAt: item.created_at.toISOString(),
      images: item.gallery_images.map(img => ({
        id: img.id,
        imageUrl: img.image_url,
        caption: img.caption,
        sortOrder: img.sort_order
      }))
    }));

    res.json({ success: true, items: mappedItems, total, totalPages, currentPage: parseInt(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createGallery = async (req, res) => {
  try {
    const { 
      title, entryType, category, eventDate, location, summary, details, 
      imageUrl, imageUrls, ctaLabel, ctaUrl, isFeatured, isPublished, userId 
    } = req.body;
    
    if (!title || !category || !imageUrl) {
      return res.status(400).json({ success: false, message: "Title, category, and primary image URL are required." });
    }

    const created = await prisma.gallery_items.create({
      data: {
        title,
        entry_type: entryType || 'event',
        category,
        event_date: eventDate ? new Date(eventDate) : null,
        location: location || null,
        summary: summary || '',
        details: details || null,
        image_url: imageUrl,
        cta_label: ctaLabel || null,
        cta_url: ctaUrl || null,
        is_featured: isFeatured ? true : false,
        is_published: isPublished !== undefined ? isPublished : true,
        created_by: userId ? parseInt(userId) : null
      }
    });

    if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
      const imageRecords = imageUrls.map((url, index) => ({
        gallery_item_id: created.id,
        image_url: url,
        sort_order: index
      }));
      await prisma.gallery_images.createMany({ data: imageRecords });
    }

    res.json({ success: true, message: "Gallery image added successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add image: " + error.message });
  }
};

exports.updateGallery = async (req, res) => {
  try {
    const { 
      itemId, title, entryType, category, eventDate, location, summary, details, 
      imageUrl, imageUrls, ctaLabel, ctaUrl, isFeatured, isPublished 
    } = req.body;
    
    if (!itemId || !title || !category) {
      return res.status(400).json({ success: false, message: "ID, Title, and Category are required." });
    }

    const updateData = {
      title,
      entry_type: entryType || 'event',
      category,
      event_date: eventDate ? new Date(eventDate) : null,
      location: location || null,
      summary: summary || '',
      details: details || null,
      cta_label: ctaLabel || null,
      cta_url: ctaUrl || null,
      is_featured: isFeatured ? true : false,
      is_published: isPublished !== undefined ? isPublished : true
    };
    
    if (imageUrl) updateData.image_url = imageUrl;

    await prisma.gallery_items.update({
      where: { id: parseInt(itemId) },
      data: updateData
    });

    if (imageUrls && Array.isArray(imageUrls)) {
      await prisma.gallery_images.deleteMany({ where: { gallery_item_id: parseInt(itemId) } });
      if (imageUrls.length > 0) {
        const imageRecords = imageUrls.map((url, index) => ({
          gallery_item_id: parseInt(itemId),
          image_url: url,
          sort_order: index
        }));
        await prisma.gallery_images.createMany({ data: imageRecords });
      }
    }

    res.json({ success: true, message: "Gallery item updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update item: " + error.message });
  }
};

exports.deleteGallery = async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ success: false, message: "Item ID is required." });

    await prisma.gallery_items.delete({ where: { id: parseInt(itemId) } });
    res.json({ success: true, message: "Item deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete item." });
  }
};

exports.uploadGallery = async (req, res) => {
  try {
    const files = req.files || req.file;
    const fileArray = Array.isArray(files) ? files : (files ? [files] : []);
    
    if (fileArray.length === 0) {
      return res.status(400).json({ success: false, message: "No gallery image provided." });
    }

    const maxSize = 8 * 1024 * 1024; // 8MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const uploadedImages = [];

    for (let file of fileArray) {
      if (file.size > maxSize) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ success: false, message: "Each image must be 8MB or smaller." });
      }

      if (!allowedTypes.includes(file.mimetype)) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ success: false, message: "Invalid image type. Upload JPG, PNG, WebP, or GIF images." });
      }

      uploadedImages.push({
        imageUrl: `/uploads/gallery/${file.filename}`,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size
      });
    }

    res.json({
      success: true,
      message: "Gallery image(s) uploaded successfully.",
      imageUrl: uploadedImages[0].imageUrl,
      images: uploadedImages
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Upload error: " + error.message });
  }
};
