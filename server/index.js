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

// Static uploads directory (safe for Vercel read-only filesystem)
const uploadsDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '..', 'uploads');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.warn('[Uploads] Directory creation skipped:', e.message);
}
app.use('/uploads', express.static(uploadsDir));

// API Routes (Mounted both with and without /api prefix for Vercel serverless compatibility)
const routeList = [
  ['/auth', authRoutes],
  ['/appointments', appointmentRoutes],
  ['/consultations', consultationRoutes],
  ['/doctors', doctorRoutes],
  ['/services', serviceRoutes],
  ['/patients', patientRoutes],
  ['/testimonials', testimonialRoutes],
  ['/insurance', insuranceRoutes],
  ['/blog', blogRoutes],
  ['/faqs', faqRoutes],
  ['/gallery', galleryRoutes],
  ['/cms', cmsRoutes],
  ['/settings', settingsRoutes],
  ['/messages', messageRoutes],
  ['/stats', statRoutes],
  ['/upload', uploadRoutes]
];

for (const [prefix, r] of routeList) {
  app.use(`/api${prefix}`, r);
  app.use(prefix, r);
}

// Health checks
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Serve frontend build if exists
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Unhandled error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start Server if run directly
if (!process.env.VERCEL && require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Dental Care Server] running on http://localhost:${PORT}`);
  });
}

module.exports = app;

