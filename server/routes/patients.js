const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../auth');

const router = express.Router();

// Admin: Get patients with search
router.get('/', authenticateAdmin, (req, res) => {
  const { search } = req.query;
  let query = 'SELECT * FROM patients WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY created_at DESC';

  const patients = db.prepare(query).all(...params);
  res.json({ success: true, patients });
});

// Admin: Get single patient profile with appointment history & consultations
router.get('/:id', authenticateAdmin, (req, res) => {
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const appointments = db.prepare(`
    SELECT * FROM appointments 
    WHERE patient_id = ? OR patient_phone = ?
    ORDER BY appointment_date DESC
  `).all(patient.id, patient.phone);

  const consultations = db.prepare(`
    SELECT * FROM consultations
    WHERE patient_phone = ?
    ORDER BY created_at DESC
  `).all(patient.phone);

  res.json({
    success: true,
    patient,
    appointments,
    consultations
  });
});

// Admin: Add patient
router.post('/', authenticateAdmin, (req, res) => {
  const { name, email, phone, age, gender, medical_notes } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Patient Name and Phone are required' });
  }

  const existing = db.prepare('SELECT id FROM patients WHERE phone = ?').get(phone.trim());
  if (existing) {
    return res.status(400).json({ error: 'A patient with this phone number already exists' });
  }

  const result = db.prepare(`
    INSERT INTO patients (name, email, phone, age, gender, medical_notes, total_visits)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(
    name.trim(),
    email ? email.trim() : null,
    phone.trim(),
    age ? parseInt(age, 10) : null,
    gender || 'Unspecified',
    medical_notes || null
  );

  const created = db.prepare('SELECT * FROM patients WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, patient: created, message: 'Patient profile created' });
});

// Admin: Edit patient
router.put('/:id', authenticateAdmin, (req, res) => {
  const { name, email, phone, age, gender, medical_notes } = req.body;
  const current = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!current) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  db.prepare(`
    UPDATE patients
    SET name = ?, email = ?, phone = ?, age = ?, gender = ?, medical_notes = ?
    WHERE id = ?
  `).run(
    name || current.name,
    email !== undefined ? email : current.email,
    phone || current.phone,
    age !== undefined ? parseInt(age, 10) : current.age,
    gender || current.gender,
    medical_notes !== undefined ? medical_notes : current.medical_notes,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  res.json({ success: true, patient: updated, message: 'Patient updated successfully' });
});

// Admin: Delete patient
router.delete('/:id', authenticateAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM patients WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  res.json({ success: true, message: 'Patient removed successfully' });
});

module.exports = router;

