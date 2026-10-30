const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../auth');

const router = express.Router();

// Public: Get all active doctors
router.get('/', (req, res) => {
  const doctors = db.prepare(`
    SELECT * FROM doctors 
    WHERE is_active = 1 
    ORDER BY order_index ASC, id ASC
  `).all();
  res.json({ success: true, doctors });
});

// Admin: Get all doctors including inactive
router.get('/all', authenticateAdmin, (req, res) => {
  const doctors = db.prepare('SELECT * FROM doctors ORDER BY order_index ASC, id ASC').all();
  res.json({ success: true, doctors });
});

// Get single doctor
router.get('/:id', (req, res) => {
  const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id);
  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found' });
  }
  res.json({ success: true, doctor });
});

// Admin: Add new doctor
router.post('/', authenticateAdmin, (req, res) => {
  const {
    name,
    qualification,
    specialization,
    experience_years,
    rating = 4.9,
    reviews_count = 100,
    photo,
    bio,
    consultation_fee = 2500,
    available_days = 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
    available_start_time = '11:00',
    available_end_time = '23:59',
    order_index = 0
  } = req.body;

  if (!name || !qualification || !specialization) {
    return res.status(400).json({ error: 'Name, qualification, and specialization are required' });
  }

  const defaultPhoto = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80';

  const result = db.prepare(`
    INSERT INTO doctors (
      name, qualification, specialization, experience_years, rating, reviews_count,
      photo, bio, consultation_fee, available_days, available_start_time, available_end_time,
      is_active, order_index
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    name.trim(),
    qualification.trim(),
    specialization.trim(),
    parseInt(experience_years, 10) || 5,
    parseFloat(rating) || 4.9,
    parseInt(reviews_count, 10) || 100,
    photo || defaultPhoto,
    bio || 'Dedicated dental specialist at Dental Care clinic.',
    parseInt(consultation_fee, 10) || 2500,
    available_days,
    available_start_time,
    available_end_time,
    parseInt(order_index, 10) || 0
  );

  const created = db.prepare('SELECT * FROM doctors WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, doctor: created, message: 'Doctor added successfully' });
});

// Admin: Update doctor
router.put('/:id', authenticateAdmin, (req, res) => {
  const {
    name,
    qualification,
    specialization,
    experience_years,
    rating,
    reviews_count,
    photo,
    bio,
    consultation_fee,
    available_days,
    available_start_time,
    available_end_time,
    is_active,
    order_index
  } = req.body;

  const current = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id);
  if (!current) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  db.prepare(`
    UPDATE doctors
    SET name = ?, qualification = ?, specialization = ?,
        experience_years = ?, rating = ?, reviews_count = ?,
        photo = ?, bio = ?, consultation_fee = ?,
        available_days = ?, available_start_time = ?, available_end_time = ?,
        is_active = ?, order_index = ?
    WHERE id = ?
  `).run(
    name || current.name,
    qualification || current.qualification,
    specialization || current.specialization,
    experience_years !== undefined ? parseInt(experience_years, 10) : current.experience_years,
    rating !== undefined ? parseFloat(rating) : current.rating,
    reviews_count !== undefined ? parseInt(reviews_count, 10) : current.reviews_count,
    photo !== undefined ? photo : current.photo,
    bio !== undefined ? bio : current.bio,
    consultation_fee !== undefined ? parseInt(consultation_fee, 10) : current.consultation_fee,
    available_days || current.available_days,
    available_start_time || current.available_start_time,
    available_end_time || current.available_end_time,
    is_active !== undefined ? (is_active ? 1 : 0) : current.is_active,
    order_index !== undefined ? parseInt(order_index, 10) : current.order_index,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id);
  res.json({ success: true, doctor: updated, message: 'Doctor updated successfully' });
});

// Admin: Toggle active status
router.patch('/:id/toggle-status', authenticateAdmin, (req, res) => {
  const current = db.prepare('SELECT is_active FROM doctors WHERE id = ?').get(req.params.id);
  if (!current) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  const nextStatus = current.is_active ? 0 : 1;
  db.prepare('UPDATE doctors SET is_active = ? WHERE id = ?').run(nextStatus, req.params.id);
  res.json({ success: true, is_active: nextStatus, message: `Doctor ${nextStatus ? 'activated' : 'deactivated'}` });
});

// Admin: Delete doctor
router.delete('/:id', authenticateAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM doctors WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Doctor not found' });
  }
  res.json({ success: true, message: 'Doctor removed successfully' });
});

module.exports = router;

