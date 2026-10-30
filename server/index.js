const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('node:path');
const fs = require('node:fs');

// Initialize Database
require('./db');

const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const consultationRoutes = require('./routes/consultations');
const doctorRoutes = require('./routes/doctors');
const serviceRoutes = require('./routes/services');
const patientRoutes = require('./routes/patients');
const testimonialRoutes = require('./routes/testimonials');
const insuranceRoutes = require('./routes/insurance');
const blogRoutes = require('./routes/blog');
const faqRoutes = require('./routes/faqs');
const galleryRoutes = require('./routes/gallery');
const cmsRoutes = require('./routes/cms');
const settingsRoutes = require('./routes/settings');
const messageRoutes = require('./routes/messages');
const statRoutes = require('./routes/stats');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Static uploads directory
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stats', statRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend build if exists
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`[Dental Care Server] running on http://localhost:${PORT}`);
});

