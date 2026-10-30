const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../auth');

const router = express.Router();

// Public: Get approved testimonials
router.get('/', (req, res) => {
  const list = db.prepare('SELECT * FROM testimonials WHERE is_approved = 1 ORDER BY id DESC').all();
  res.json({ success: true, testimonials: list });
});

// Public: Submit patient review (stored with is_approved = 0 until admin approves)
router.post('/submit', (req, res) => {
  const { patient_name, photo, rating = 5.0, treatment, review_text } = req.body;
  if (!patient_name || !review_text) {
    return res.status(400).json({ error: 'Please provide your name and review message.' });
  }

  const cleanRating = Math.max(1, Math.min(5, parseFloat(rating) || 5.0));

  const result = db.prepare(`
    INSERT INTO testimonials (patient_name, photo, rating, treatment, review_text, is_approved)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(
    patient_name.trim(),
    photo ? photo.trim() : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    cleanRating,
    treatment ? treatment.trim() : 'General Dental Treatment',
    review_text.trim()
  );

  const created = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({
    success: true,
    message: 'Thank you for your review! It has been submitted for clinic verification and will appear on the website once approved by our team.',
    testimonial: created
  });
});

// Admin: Get all testimonials
router.get('/all', authenticateAdmin, (req, res) => {
  const list = db.prepare('SELECT * FROM testimonials ORDER BY id DESC').all();
  res.json({ success: true, testimonials: list });
});

// Admin: Add testimonial
router.post('/', authenticateAdmin, (req, res) => {
  const { patient_name, photo, rating = 5.0, treatment, review_text } = req.body;
  if (!patient_name || !review_text) {
    return res.status(400).json({ error: 'Patient name and review text are required' });
  }

  const result = db.prepare(`
    INSERT INTO testimonials (patient_name, photo, rating, treatment, review_text, is_approved)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(
    patient_name.trim(),
    photo || null,
    parseFloat(rating) || 5.0,
    treatment || 'General Dental Treatment',
    review_text.trim()
  );

  const created = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, testimonial: created, message: 'Review added' });
});

// Admin: Edit testimonial
router.put('/:id', authenticateAdmin, (req, res) => {
  const { patient_name, photo, rating, treatment, review_text, is_approved } = req.body;
  const current = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(req.params.id);
  if (!current) {
    return res.status(404).json({ error: 'Review not found' });
  }

  db.prepare(`
    UPDATE testimonials
    SET patient_name = ?, photo = ?, rating = ?, treatment = ?, review_text = ?, is_approved = ?
    WHERE id = ?
  `).run(
    patient_name || current.patient_name,
    photo !== undefined ? photo : current.photo,
    rating !== undefined ? parseFloat(rating) : current.rating,
    treatment !== undefined ? treatment : current.treatment,
    review_text || current.review_text,
    is_approved !== undefined ? (is_approved ? 1 : 0) : current.is_approved,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(req.params.id);
  res.json({ success: true, testimonial: updated, message: 'Review updated' });
});

// Admin: Toggle approval status
router.patch('/:id/toggle-approve', authenticateAdmin, (req, res) => {
  const current = db.prepare('SELECT is_approved FROM testimonials WHERE id = ?').get(req.params.id);
  if (!current) {
    return res.status(404).json({ error: 'Review not found' });
  }

  const nextStatus = current.is_approved ? 0 : 1;
  db.prepare('UPDATE testimonials SET is_approved = ? WHERE id = ?').run(nextStatus, req.params.id);
  res.json({ success: true, is_approved: nextStatus, message: `Review ${nextStatus ? 'approved' : 'hidden'}` });
});

// Admin: Delete testimonial
router.delete('/:id', authenticateAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM testimonials WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Review not found' });
  }
  res.json({ success: true, message: 'Review deleted' });
});

module.exports = router;

