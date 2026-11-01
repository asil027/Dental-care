const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../auth');
const { supabase } = require('../supabase');

const router = express.Router();

// Public: Submit consultation request
router.post('/request', async (req, res) => {
  const { patient_name, patient_email, patient_phone, doctor_id, preferred_date, preferred_time, dental_concern } = req.body;

  if (!patient_name || !patient_phone || !dental_concern) {
    return res.status(400).json({ error: 'Patient name, phone, and dental concern description are required' });
  }

  // Dynamic off-days check
  if (preferred_date) {
    const settingsRow = db.prepare('SELECT value FROM clinic_settings WHERE key = ?').get('weekly_holiday');
    const offDays = (settingsRow?.value || 'Friday').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!offDays.includes('none')) {
      const [year, month, day] = preferred_date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[dateObj.getDay()];
      if (offDays.includes(dayName.toLowerCase())) {
        return res.status(400).json({ error: `Dental clinic is closed on ${dayName}s. Please choose a working day.` });
      }
    }
  }

  let createdId = null;
  let supabaseRecord = null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .insert([{
          patient_name: patient_name.trim(),
          patient_email: patient_email || '',
          patient_phone: patient_phone.trim(),
          doctor_id: doctor_id ? parseInt(doctor_id, 10) : null,
          preferred_date: preferred_date || null,
          preferred_time: preferred_time || null,
          dental_concern: dental_concern.trim(),
          status: 'Pending'
        }])
        .select()
        .single();
      if (!error && data) {
        supabaseRecord = data;
        createdId = data.id;
      }
    } catch (e) {
      console.warn('[Supabase Consultation Error]', e.message);
    }
  }

  // Always persist into local store/SQLite for fast fallback
  try {
    const result = db.prepare(`
      INSERT INTO consultations (
        patient_name, patient_email, patient_phone, doctor_id, preferred_date, preferred_time, dental_concern, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
    `).run(
      patient_name.trim(),
      patient_email || '',
      patient_phone.trim(),
      doctor_id ? parseInt(doctor_id, 10) : null,
      preferred_date || null,
      preferred_time || null,
      dental_concern.trim()
    );
    if (!createdId) createdId = result.lastInsertRowid;
  } catch (e) {
    console.warn('[Local Consultation Insert Error]', e.message);
  }

  const created = supabaseRecord || db.prepare('SELECT * FROM consultations WHERE id = ?').get(createdId) || {
    id: createdId || Date.now(),
    patient_name,
    patient_email,
    patient_phone,
    doctor_id,
    preferred_date,
    preferred_time,
    dental_concern,
    status: 'Pending',
    created_at: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Consultation request submitted! A dental coordinator will contact you promptly.',
    consultation: created
  });
});

// Admin: Get all consultations
router.get('/', authenticateAdmin, async (req, res) => {
  const { status } = req.query;

  // Build doctor names map
  const doctors = db.prepare('SELECT id, name FROM doctors').all();
  const docMap = {};
  for (const d of doctors) docMap[d.id] = d.name;

  if (supabase) {
    try {
      let supaQuery = supabase.from('consultations').select('*');
      if (status && status !== 'All') supaQuery = supaQuery.eq('status', status);
      supaQuery = supaQuery.order('id', { ascending: false });
      const { data, error } = await supaQuery;
      if (!error && data && data.length > 0) {
        const mapped = data.map((c) => ({
          ...c,
          doctor_name: c.doctor_id ? (docMap[c.doctor_id] || `Doctor #${c.doctor_id}`) : 'General Specialist'
        }));
        return res.json({ success: true, consultations: mapped });
      }
    } catch (e) {
      console.warn('[Supabase Consultations Fetch Error]', e.message);
    }
  }

  let query = `
    SELECT c.*, d.name as doctor_name 
    FROM consultations c
    LEFT JOIN doctors d ON c.doctor_id = d.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'All') {
    query += ' AND c.status = ?';
    params.push(status);
  }

  query += ' ORDER BY c.id DESC';

  const list = db.prepare(query).all(...params);
  const mappedList = list.map((c) => ({
    ...c,
    doctor_name: c.doctor_name || (c.doctor_id ? docMap[c.doctor_id] : null) || 'General Specialist'
  }));

  res.json({ success: true, consultations: mappedList });
});

// Admin: Manually create a consultation inquiry
router.post('/manual', authenticateAdmin, async (req, res) => {
  const {
    patient_name,
    patient_email,
    patient_phone,
    doctor_id,
    preferred_date,
    preferred_time,
    dental_concern,
    status = 'Pending'
  } = req.body;

  if (!patient_name || !patient_phone || !dental_concern) {
    return res.status(400).json({ error: 'Patient name, phone, and dental concern description are required' });
  }

  let created = null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .insert([{
          patient_name: patient_name.trim(),
          patient_email: patient_email || '',
          patient_phone: patient_phone.trim(),
          doctor_id: doctor_id ? parseInt(doctor_id, 10) : null,
          preferred_date: preferred_date || null,
          preferred_time: preferred_time || null,
          dental_concern: dental_concern.trim(),
          status
        }])
        .select()
        .single();
      if (!error && data) created = data;
    } catch (e) {}
  }

  const result = db.prepare(`
    INSERT INTO consultations (
      patient_name, patient_email, patient_phone, doctor_id, preferred_date, preferred_time, dental_concern, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    patient_name.trim(),
    patient_email || '',
    patient_phone.trim(),
    doctor_id ? parseInt(doctor_id, 10) : null,
    preferred_date || null,
    preferred_time || null,
    dental_concern.trim(),
    status
  );

  if (!created) {
    created = db.prepare('SELECT * FROM consultations WHERE id = ?').get(result.lastInsertRowid);
  }

  res.status(201).json({
    success: true,
    message: 'Consultation inquiry created successfully',
    consultation: created
  });
});

// Admin: Update consultation status (Approved, Rejected, Rescheduled, Cancelled, Completed)
router.patch('/:id/status', authenticateAdmin, async (req, res) => {
  const { status, preferred_date, preferred_time } = req.body;

  if (supabase) {
    try {
      await supabase.from('consultations').update({
        status,
        ...(preferred_date ? { preferred_date } : {}),
        ...(preferred_time ? { preferred_time } : {})
      }).eq('id', req.params.id);
    } catch (e) {}
  }

  let query = 'UPDATE consultations SET status = ?';
  const params = [status];

  if (preferred_date) {
    query += ', preferred_date = ?';
    params.push(preferred_date);
  }
  if (preferred_time) {
    query += ', preferred_time = ?';
    params.push(preferred_time);
  }

  query += ' WHERE id = ?';
  params.push(req.params.id);

  db.prepare(query).run(...params);

  const updated = db.prepare('SELECT * FROM consultations WHERE id = ?').get(req.params.id);
  res.json({ success: true, consultation: updated, message: `Consultation marked as ${status}` });
});

// Admin: Delete consultation
router.delete('/:id', authenticateAdmin, async (req, res) => {
  if (supabase) {
    try {
      await supabase.from('consultations').delete().eq('id', req.params.id);
    } catch (e) {}
  }

  const result = db.prepare('DELETE FROM consultations WHERE id = ?').run(req.params.id);
  if (result.changes === 0 && !supabase) {
    return res.status(404).json({ error: 'Consultation request not found' });
  }
  res.json({ success: true, message: 'Consultation deleted successfully' });
});

module.exports = router;
