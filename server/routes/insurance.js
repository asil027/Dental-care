const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../auth');

const router = express.Router();

// Public: Get active insurance providers
router.get('/', (req, res) => {
  const list = db.prepare('SELECT * FROM insurance_providers WHERE is_active = 1 ORDER BY id ASC').all();
  res.json({ success: true, insurance: list });
});

// Admin: Get all insurance providers
router.get('/all', authenticateAdmin, (req, res) => {
  const list = db.prepare('SELECT * FROM insurance_providers ORDER BY id ASC').all();
  res.json({ success: true, insurance: list });
});

// Admin: Add provider
router.post('/', authenticateAdmin, (req, res) => {
  const { name, logo, coverage_summary } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Insurance provider name is required' });
  }

  const result = db.prepare(`
    INSERT INTO insurance_providers (name, logo, coverage_summary, is_active)
    VALUES (?, ?, ?, 1)
  `).run(name.trim(), logo || null, coverage_summary || 'Covers outpatient and surgical procedures');

  const created = db.prepare('SELECT * FROM insurance_providers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, provider: created, message: 'Insurance provider added' });
});

// Admin: Edit provider
router.put('/:id', authenticateAdmin, (req, res) => {
  const { name, logo, coverage_summary, is_active } = req.body;
  const current = db.prepare('SELECT * FROM insurance_providers WHERE id = ?').get(req.params.id);
  if (!current) {
    return res.status(404).json({ error: 'Provider not found' });
  }

  db.prepare(`
    UPDATE insurance_providers
    SET name = ?, logo = ?, coverage_summary = ?, is_active = ?
    WHERE id = ?
  `).run(
    name || current.name,
    logo !== undefined ? logo : current.logo,
    coverage_summary !== undefined ? coverage_summary : current.coverage_summary,
    is_active !== undefined ? (is_active ? 1 : 0) : current.is_active,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM insurance_providers WHERE id = ?').get(req.params.id);
  res.json({ success: true, provider: updated, message: 'Provider updated' });
});

// Admin: Delete provider
router.delete('/:id', authenticateAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM insurance_providers WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Provider not found' });
  }
  res.json({ success: true, message: 'Provider deleted' });
});

module.exports = router;

