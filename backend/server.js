const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { initCronJobs } = require('./src/utils/cronJobs');

const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const ebookRoutes = require('./src/routes/ebookRoutes');
const galleryRoutes = require('./src/routes/galleryRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const onlineClassRoutes = require('./src/routes/onlineClassRoutes');
const homeRoutes = require('./src/routes/homeRoutes');
const quizRoutes = require('./src/routes/quizRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const systemRoutes = require('./src/routes/systemRoutes');
const teacherRoutes = require('./src/routes/teacherRoutes');
const userRoutes = require('./src/routes/userRoutes');
const walletRoutes = require('./src/routes/walletRoutes');
const globalUploadRoutes = require('./src/routes/globalUploadRoutes');
const teacherMessageRoutes = require('./src/routes/teacherMessageRoutes');
const bankRoutes = require('./src/routes/bankRoutes');
const smsRoutes = require('./src/routes/smsRoutes');

const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 image uploads

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/course', courseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ebook', ebookRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/online_class', onlineClassRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/user', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/upload', globalUploadRoutes);
app.use('/api/teacher-messages', teacherMessageRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/sms', smsRoutes);

// Test Route
app.get('/', (req, res) => {
  res.json({ message: 'TechnoHub API is running' });
});

// Initialize Cron Jobs
initCronJobs();

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await prisma.$connect();
    console.log("Database connected successfully! ✅");
  } catch (error) {
    console.error("Database connection failed ❌:", error.message);
  }
});
