const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../auth');
const { supabase } = require('../supabase');

const router = express.Router();

// Public: Get all clinic settings
router.get('/', async (req, res) => {
  const settings = {};

  // 1. If Supabase is available, fetch live settings from Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase.from('clinic_settings').select('key, value');
      if (!error && data && data.length > 0) {
        for (const row of data) {
          settings[row.key] = row.value;
          try {
            db.prepare(`
              INSERT INTO clinic_settings (key, value)
              VALUES (?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value
            `).run(row.key, String(row.value));
          } catch (e) {}
        }
        return res.json({ success: true, settings });
      }
    } catch (e) {
      console.warn('[Supabase Settings Fetch Error]:', e.message);
    }
  }

  // 2. Fallback to SQLite / memory store
  const rows = db.prepare('SELECT key, value FROM clinic_settings').all();
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json({ success: true, settings });
});

// Admin: Update settings (batch key-value pairs)
router.put('/', authenticateAdmin, async (req, res) => {
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

  // 1. Upsert into Supabase if configured
  if (supabase) {
    try {
      const upsertRows = Object.entries(updates).map(([key, value]) => ({
        key,
        value: String(value)
      }));
      await supabase.from('clinic_settings').upsert(upsertRows, { onConflict: 'key' });
    } catch (e) {
      console.warn('[Supabase Settings Upsert Error]:', e.message);
    }
  }

  // 2. Upsert into SQLite / memory store
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

