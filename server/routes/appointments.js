const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../auth');
const { supabase } = require('../supabase');

const router = express.Router();

function getClinicSettings() {
  const rows = db.prepare('SELECT key, value FROM clinic_settings').all();
  const settings = {};
  for (const r of rows) settings[r.key] = r.value;
  return settings;
}

function parseTimeToMinutes(t) {
  if (!t) return null;
  const m = t.trim().match(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const mer = m[3].toUpperCase();
  if (mer === 'PM' && h !== 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

function formatMinutesToTime(mins) {
  let h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const mer = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return (h12 < 10 ? '0' + h12 : h12) + ':' + (m < 10 ? '0' + m : m) + ' ' + mer;
}

function generateDynamicSlots(startStr, endStr, duration = 30) {
  let start = parseTimeToMinutes(startStr) ?? 11 * 60;
  let end = parseTimeToMinutes(endStr) ?? 24 * 60;
  if (end === 0) end = 24 * 60; // 12:00 AM midnight
  if (end <= start) end += 24 * 60; // overnight extension

  const slots = [];
  const dur = parseInt(duration, 10) || 30;
  for (let t = start; t < end; t += dur) {
    slots.push(formatMinutesToTime(t));
  }
  return slots;
}

// Helper to check valid date & time according to dynamic clinic rules
function validateAppointmentSlot(dateStr, timeStr, doctorId, excludeAppointmentId = null) {
  const settings = getClinicSettings();

  // 1. Date format check
  const appointmentDate = new Date(dateStr + 'T12:00:00Z');
  if (isNaN(appointmentDate.getTime())) {
    return { valid: false, error: 'Invalid appointment date format' };
  }

  // 2. Prevent past dates (today or future in Asia/Karachi)
  const now = new Date();
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(now);
  if (dateStr < todayStr) {
    return { valid: false, error: 'Cannot book appointments for past dates' };
  }

  // 3. Dynamic Off Days check (Not fixed to Sunday!)
  const [year, month, day] = dateStr.split('-').map(Number);
  const checkDate = new Date(year, month - 1, day);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[checkDate.getDay()];

  const offDays = (settings.weekly_holiday || 'Sunday')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!offDays.includes('none') && offDays.includes(dayName.toLowerCase())) {
    return {
      valid: false,
      error: `The clinic is closed on ${dayName}s. Off day configured: ${settings.weekly_holiday}. Please select an available working day.`
    };
  }

  // 4. Dynamic Operating hours check
  const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/i;
  const match = timeStr.trim().match(timeRegex);
  if (!match) {
    return { valid: false, error: 'Invalid time format. Example: 11:30 AM, 04:00 PM' };
  }

  let hour = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  const startMin = parseTimeToMinutes(settings.operating_start_time || '11:00 AM') ?? 11 * 60;
  let endMin = parseTimeToMinutes(settings.operating_end_time || '12:00 AM') ?? 24 * 60;
  if (endMin === 0) endMin = 24 * 60;
  if (endMin <= startMin) endMin += 24 * 60;

  let timeMinutes = hour * 60 + minutes;
  if (timeMinutes < startMin && endMin > 24 * 60) {
    timeMinutes += 24 * 60;
  }

  if (timeMinutes < startMin || timeMinutes >= endMin) {
    return {
      valid: false,
      error: `Operating hours are ${settings.operating_start_time || '11:00 AM'} to ${settings.operating_end_time || '12:00 AM'}. Please pick a slot within working hours.`
    };
  }

  // 5. Prevent double booking for same doctor, date and time
  let checkConflictQuery = `
    SELECT id, patient_name, appointment_time, doctor_name 
    FROM appointments 
    WHERE doctor_id = ? 
      AND appointment_date = ? 
      AND LOWER(TRIM(appointment_time)) = LOWER(TRIM(?))
      AND status NOT IN ('Cancelled', 'Rejected')
  `;
  const params = [doctorId, dateStr, timeStr];

  if (excludeAppointmentId) {
    checkConflictQuery += ` AND id != ?`;
    params.push(excludeAppointmentId);
  }

  const conflict = db.prepare(checkConflictQuery).get(...params);
  if (conflict) {
    return { 
      valid: false, 
      error: `Doctor is already booked at ${timeStr} on ${dateStr}. Please choose a different time slot or doctor.` 
    };
  }

  return { valid: true };
}

// Check availability for a specific doctor & date dynamically
router.get('/check-availability', (req, res) => {
  const { doctor_id, date } = req.query;
  if (!doctor_id || !date) {
    return res.status(400).json({ error: 'doctor_id and date are required' });
  }

  const settings = getClinicSettings();

  // Check if date is in configured off days
  const [year, month, day] = date.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[targetDate.getDay()];

  const offDays = (settings.weekly_holiday || 'Sunday')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!offDays.includes('none') && offDays.includes(dayName.toLowerCase())) {
    return res.json({ 
      isClosed: true, 
      message: `Clinic is closed on ${dayName}s (Weekly off day)`,
      dayName,
      availableSlots: [] 
    });
  }

  // Generate dynamic slots based on admin configured start & end times and duration
  const allSlots = generateDynamicSlots(
    settings.operating_start_time || '11:00 AM',
    settings.operating_end_time || '12:00 AM',
    settings.slot_duration || 30
  );

  // Fetch booked slots for this doctor on this date
  const booked = db.prepare(`
    SELECT appointment_time 
    FROM appointments 
    WHERE doctor_id = ? 
      AND appointment_date = ? 
      AND status NOT IN ('Cancelled', 'Rejected')
  `).all(doctor_id, date);

  const bookedSet = new Set(booked.map(b => b.appointment_time.trim().toUpperCase()));
  const availableSlots = allSlots.filter(s => !bookedSet.has(s.toUpperCase()));

  res.json({
    isClosed: false,
    dayName,
    doctor_id,
    date,
    allSlots,
    bookedSlots: Array.from(bookedSet),
    availableSlots,
    operating_hours: `${settings.operating_start_time || '11:00 AM'} – ${settings.operating_end_time || '12:00 AM'}`
  });
});

// Public: Book appointment
router.post('/book', async (req, res) => {
  const {
    patient_name,
    patient_email,
    patient_phone,
    doctor_id,
    service_id,
    appointment_date,
    appointment_time,
    notes
  } = req.body;

  if (!patient_name || !patient_email || !patient_phone || !doctor_id || !service_id || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

  // Validate Slot with dynamic clinic rules
  const validation = validateAppointmentSlot(appointment_date, appointment_time, doctor_id);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  // Lookup Doctor
  const doctor = db.prepare('SELECT id, name, consultation_fee FROM doctors WHERE id = ?').get(doctor_id);
  if (!doctor) {
    return res.status(404).json({ error: 'Selected doctor not found' });
  }

  // Lookup Service
  const service = db.prepare('SELECT id, name, price FROM services WHERE id = ?').get(service_id);
  if (!service) {
    return res.status(404).json({ error: 'Selected service not found' });
  }

  // Upsert Patient
  let patient = db.prepare('SELECT id FROM patients WHERE phone = ?').get(patient_phone);
  let patientId;
  if (!patient) {
    const insertPatient = db.prepare(`
      INSERT INTO patients (name, email, phone, total_visits)
      VALUES (?, ?, ?, 1)
    `);
    const pRes = insertPatient.run(patient_name, patient_email, patient_phone);
    patientId = Number(pRes.lastInsertRowid);
  } else {
    patientId = patient.id;
    db.prepare('UPDATE patients SET total_visits = total_visits + 1, email = ? WHERE id = ?')
      .run(patient_email, patientId);
  }

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const appointmentCode = `DC-2026-${randomSuffix}`;
  const fee = service.price || doctor.consultation_fee || 2500;

  try {
    if (supabase) {
      try {
        const { data: supaAppt, error: supaErr } = await supabase
          .from('appointments')
          .insert([{
            appointment_code: appointmentCode,
            patient_id: patientId,
            patient_name: patient_name.trim(),
            patient_email: patient_email.trim(),
            patient_phone: patient_phone.trim(),
            doctor_id: doctor.id,
            doctor_name: doctor.name,
            service_id: service.id,
            service_name: service.name,
            appointment_date,
            appointment_time,
            notes: notes || 'Booked online via Dental Care portal',
            status: 'Pending',
            fee
          }])
          .select()
          .single();

        if (!supaErr && supaAppt) {
          return res.status(201).json({
            success: true,
            message: 'Appointment booked successfully! Our reception team will confirm shortly.',
            appointment: supaAppt
          });
        }
      } catch (e) {
        console.warn('[Supabase Appointment Insert Error]', e.message);
      }
    }

    const insertAppt = db.prepare(`
      INSERT INTO appointments (
        appointment_code, patient_id, patient_name, patient_email, patient_phone,
        doctor_id, doctor_name, service_id, service_name,
        appointment_date, appointment_time, notes, status, fee
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
    `);

    const result = insertAppt.run(
      appointmentCode,
      patientId,
      patient_name.trim(),
      patient_email.trim(),
      patient_phone.trim(),
      doctor.id,
      doctor.name,
      service.id,
      service.name,
      appointment_date,
      appointment_time,
      notes || 'Booked online via Dental Care portal',
      fee
    );

    const created = db.prepare('SELECT * FROM appointments WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully! Our reception team will confirm shortly.',
      appointment: created
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record appointment: ' + err.message });
  }
});

// Admin: Get all appointments with filtering & search
router.get('/', authenticateAdmin, async (req, res) => {
  const { search, doctor_id, status, date } = req.query;

  if (supabase) {
    try {
      let supaQuery = supabase.from('appointments').select('*');
      if (doctor_id) supaQuery = supaQuery.eq('doctor_id', doctor_id);
      if (status && status !== 'All') supaQuery = supaQuery.eq('status', status);
      if (date) supaQuery = supaQuery.eq('appointment_date', date);
      supaQuery = supaQuery.order('appointment_date', { ascending: false });

      const { data, error } = await supaQuery;
      if (!error && data && data.length > 0) {
        let filtered = data;
        if (search) {
          const s = search.toLowerCase();
          filtered = data.filter(a => 
            (a.patient_name && a.patient_name.toLowerCase().includes(s)) ||
            (a.patient_phone && a.patient_phone.includes(s)) ||
            (a.appointment_code && a.appointment_code.toLowerCase().includes(s))
          );
        }
        return res.json({ success: true, appointments: filtered });
      }
    } catch (e) {
      console.warn('[Supabase Appointments Fetch Error]', e.message);
    }
  }

  let query = 'SELECT * FROM appointments WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (patient_name LIKE ? OR patient_phone LIKE ? OR appointment_code LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  if (doctor_id) {
    query += ' AND doctor_id = ?';
    params.push(doctor_id);
  }

  if (status && status !== 'All') {
    query += ' AND status = ?';
    params.push(status);
  }

  if (date) {
    query += ' AND appointment_date = ?';
    params.push(date);
  }

  query += ' ORDER BY appointment_date DESC, appointment_time DESC';

  const list = db.prepare(query).all(...params);
  res.json({ success: true, appointments: list });
});

// Admin: Get single appointment details
router.get('/:id', authenticateAdmin, (req, res) => {
  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!appt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  res.json({ success: true, appointment: appt });
});

// Admin: Create manual appointment
router.post('/manual', authenticateAdmin, (req, res) => {
  const {
    patient_name,
    patient_email,
    patient_phone,
    doctor_id,
    service_id,
    appointment_date,
    appointment_time,
    notes,
    status = 'Confirmed',
    fee
  } = req.body;

  if (!patient_name || !patient_phone || !doctor_id || !service_id || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: 'Missing required appointment fields' });
  }

  const validation = validateAppointmentSlot(appointment_date, appointment_time, doctor_id);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const doctor = db.prepare('SELECT id, name, consultation_fee FROM doctors WHERE id = ?').get(doctor_id);
  const service = db.prepare('SELECT id, name, price FROM services WHERE id = ?').get(service_id);

  if (!doctor || !service) {
    return res.status(400).json({ error: 'Invalid doctor or service selected' });
  }

  let patient = db.prepare('SELECT id FROM patients WHERE phone = ?').get(patient_phone);
  let patientId;
  if (!patient) {
    const resP = db.prepare('INSERT INTO patients (name, email, phone) VALUES (?, ?, ?)')
      .run(patient_name, patient_email || '', patient_phone);
    patientId = Number(resP.lastInsertRowid);
  } else {
    patientId = patient.id;
  }

  const code = `DC-MANUAL-${Math.floor(1000 + Math.random() * 9000)}`;
  const finalFee = fee !== undefined ? fee : (service.price || doctor.consultation_fee || 2500);

  const resAppt = db.prepare(`
    INSERT INTO appointments (
      appointment_code, patient_id, patient_name, patient_email, patient_phone,
      doctor_id, doctor_name, service_id, service_name,
      appointment_date, appointment_time, notes, status, fee
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    code,
    patientId,
    patient_name.trim(),
    patient_email || '',
    patient_phone.trim(),
    doctor.id,
    doctor.name,
    service.id,
    service.name,
    appointment_date,
    appointment_time,
    notes || 'Created by Reception/Admin',
    status,
    finalFee
  );

  const created = db.prepare('SELECT * FROM appointments WHERE id = ?').get(resAppt.lastInsertRowid);
  res.status(201).json({ success: true, appointment: created });
});

// Admin: Update appointment status
router.patch('/:id/status', authenticateAdmin, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  if (supabase) {
    try {
      await supabase.from('appointments').update({ status }).eq('id', req.params.id);
    } catch (e) {}
  }

  const update = db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, req.params.id);
  if (update.changes === 0 && !supabase) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  res.json({ success: true, appointment: updated || { id: req.params.id, status }, message: `Status updated to ${status}` });
});

// Admin: Reschedule appointment
router.patch('/:id/reschedule', authenticateAdmin, async (req, res) => {
  const { appointment_date, appointment_time, doctor_id } = req.body;
  const apptId = req.params.id;

  if (supabase) {
    try {
      await supabase.from('appointments').update({
        appointment_date,
        appointment_time,
        ...(doctor_id ? { doctor_id } : {}),
        status: 'Confirmed'
      }).eq('id', apptId);
    } catch (e) {}
  }

  const current = db.prepare('SELECT * FROM appointments WHERE id = ?').get(apptId);
  if (!current) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  const targetDocId = doctor_id || current.doctor_id;
  const validation = validateAppointmentSlot(appointment_date, appointment_time, targetDocId, apptId);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const doctor = db.prepare('SELECT name FROM doctors WHERE id = ?').get(targetDocId);

  db.prepare(`
    UPDATE appointments 
    SET appointment_date = ?, appointment_time = ?, doctor_id = ?, doctor_name = ?, status = 'Confirmed'
    WHERE id = ?
  `).run(appointment_date, appointment_time, targetDocId, doctor ? doctor.name : 'Doctor', apptId);

  const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(apptId);
  res.json({ success: true, appointment: updated, message: 'Appointment rescheduled successfully' });
});

// Admin: Edit appointment info
router.put('/:id', authenticateAdmin, (req, res) => {
  const {
    patient_name,
    patient_email,
    patient_phone,
    service_id,
    appointment_date,
    appointment_time,
    notes,
    status,
    fee
  } = req.body;

  const apptId = req.params.id;
  const existing = db.prepare('SELECT * FROM appointments WHERE id = ?').get(apptId);
  if (!existing) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  if (appointment_date !== existing.appointment_date || appointment_time !== existing.appointment_time) {
    const val = validateAppointmentSlot(appointment_date, appointment_time, existing.doctor_id, apptId);
    if (!val.valid) {
      return res.status(400).json({ error: val.error });
    }
  }

  let serviceName = existing.service_name;
  if (service_id && service_id !== existing.service_id) {
    const s = db.prepare('SELECT name FROM services WHERE id = ?').get(service_id);
    if (s) serviceName = s.name;
  }

  db.prepare(`
    UPDATE appointments
    SET patient_name = ?, patient_email = ?, patient_phone = ?,
        service_id = ?, service_name = ?,
        appointment_date = ?, appointment_time = ?,
        notes = ?, status = ?, fee = ?
    WHERE id = ?
  `).run(
    patient_name || existing.patient_name,
    patient_email || existing.patient_email,
    patient_phone || existing.patient_phone,
    service_id || existing.service_id,
    serviceName,
    appointment_date || existing.appointment_date,
    appointment_time || existing.appointment_time,
    notes !== undefined ? notes : existing.notes,
    status || existing.status,
    fee !== undefined ? fee : existing.fee,
    apptId
  );

  const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(apptId);
  res.json({ success: true, appointment: updated, message: 'Appointment updated successfully' });
});

// Admin: Delete appointment
router.delete('/:id', authenticateAdmin, async (req, res) => {
  if (supabase) {
    try {
      await supabase.from('appointments').delete().eq('id', req.params.id);
    } catch (e) {}
  }

  const result = db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
  if (result.changes === 0 && !supabase) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  res.json({ success: true, message: 'Appointment deleted successfully' });
});

module.exports = router;
