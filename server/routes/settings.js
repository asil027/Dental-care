const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../auth');

const router = express.Router();

// Public: Get all clinic settings
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM clinic_settings').all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json({ success: true, settings });
});

// Admin: Update settings (batch key-value pairs)
router.put('/', authenticateAdmin, (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Valid settings object required' });
  }

  // If latitude and longitude are provided, prioritize exact coordinate-based Google Map:
  if (updates.latitude && updates.longitude && !isNaN(Number(updates.latitude)) && !isNaN(Number(updates.longitude))) {
    updates.google_maps_url = `https://maps.google.com/maps?q=${String(updates.latitude).trim()},${String(updates.longitude).trim()}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  } else if (updates.address && updates.address.trim()) {
    updates.google_maps_url = `https://maps.google.com/maps?q=${encodeURIComponent(updates.address.trim())}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  const upsert = db.prepare(`
    INSERT INTO clinic_settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);

  for (const [key, value] of Object.entries(updates)) {
    upsert.run(key, String(value));
  }

  const rows = db.prepare('SELECT key, value FROM clinic_settings').all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  res.json({ success: true, settings, message: 'Clinic settings updated successfully' });
});

module.exports = router;

