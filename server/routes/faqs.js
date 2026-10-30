const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../auth');

const router = express.Router();

// Public: Get all active FAQs
router.get('/', (req, res) => {
  const faqs = db.prepare('SELECT * FROM faqs WHERE is_active = 1 ORDER BY order_index ASC, id ASC').all();
  res.json({ success: true, faqs });
});

// Admin: Get all FAQs
router.get('/all', authenticateAdmin, (req, res) => {
  const faqs = db.prepare('SELECT * FROM faqs ORDER BY order_index ASC, id ASC').all();
  res.json({ success: true, faqs });
});

// Admin: Add FAQ
router.post('/', authenticateAdmin, (req, res) => {
  const { question, answer, category = 'General', order_index = 0 } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required' });
  }

  const result = db.prepare(`
    INSERT INTO faqs (question, answer, category, order_index, is_active)
    VALUES (?, ?, ?, ?, 1)
  `).run(question.trim(), answer.trim(), category, parseInt(order_index, 10) || 0);

  const created = db.prepare('SELECT * FROM faqs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, faq: created, message: 'FAQ added successfully' });
});

// Admin: Edit FAQ
router.put('/:id', authenticateAdmin, (req, res) => {
  const { question, answer, category, order_index, is_active } = req.body;
  const current = db.prepare('SELECT * FROM faqs WHERE id = ?').get(req.params.id);
  if (!current) {
    return res.status(404).json({ error: 'FAQ not found' });
  }

  db.prepare(`
    UPDATE faqs
    SET question = ?, answer = ?, category = ?, order_index = ?, is_active = ?
    WHERE id = ?
  `).run(
    question || current.question,
    answer || current.answer,
    category || current.category,
    order_index !== undefined ? parseInt(order_index, 10) : current.order_index,
    is_active !== undefined ? (is_active ? 1 : 0) : current.is_active,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM faqs WHERE id = ?').get(req.params.id);
  res.json({ success: true, faq: updated, message: 'FAQ updated successfully' });
});

// Admin: Reorder FAQs
router.post('/reorder', authenticateAdmin, (req, res) => {
  const { items } = req.body; // array of { id, order_index }
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items array is required' });
  }

  const stmt = db.prepare('UPDATE faqs SET order_index = ? WHERE id = ?');
  for (const item of items) {
    stmt.run(item.order_index, item.id);
  }

  res.json({ success: true, message: 'FAQs reordered successfully' });
});

// Admin: Delete FAQ
router.delete('/:id', authenticateAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM faqs WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'FAQ not found' });
  }
  res.json({ success: true, message: 'FAQ deleted' });
});

module.exports = router;

