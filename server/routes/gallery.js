const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../auth');

const router = express.Router();

// Public: Get gallery images
router.get('/', (req, res) => {
  const images = db.prepare('SELECT * FROM gallery ORDER BY id DESC').all();
  res.json({ success: true, gallery: images });
});

// Admin: Add gallery photo
router.post('/', authenticateAdmin, (req, res) => {
  const { title, category = 'Clinic', image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'Image URL or file is required' });
  }

  const result = db.prepare('INSERT INTO gallery (title, category, image) VALUES (?, ?, ?)')
    .run(title || 'Clinic Facility', category, image);

  const created = db.prepare('SELECT * FROM gallery WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, item: created, message: 'Image added to gallery' });
});

// Admin: Delete gallery photo
router.delete('/:id', authenticateAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM gallery WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json({ success: true, message: 'Image deleted from gallery' });
});

module.exports = router;

