const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../auth');

const router = express.Router();

// Public: Submit contact form
router.post('/', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required' });
  }

  const result = db.prepare(`
    INSERT INTO contact_messages (name, email, phone, subject, message)
    VALUES (?, ?, ?, ?, ?)
  `).run(name.trim(), email.trim(), phone ? phone.trim() : null, subject ? subject.trim() : 'General Inquiry', message.trim());

  const created = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({
    success: true,
    message: 'Thank you! Your message has been received. Our clinic staff will respond shortly.',
    messageRecord: created
  });
});

// Admin: Get all messages
router.get('/', authenticateAdmin, (req, res) => {
  const list = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
  res.json({ success: true, messages: list });
});

// Admin: Mark message as read
router.patch('/:id/read', authenticateAdmin, (req, res) => {
  db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Marked as read' });
});

// Admin: Toggle read/unread status
router.patch('/:id/toggle-read', authenticateAdmin, (req, res) => {
  const current = db.prepare('SELECT is_read FROM contact_messages WHERE id = ?').get(req.params.id);
  if (!current) {
    return res.status(404).json({ error: 'Message not found' });
  }
  const nextStatus = current.is_read ? 0 : 1;
  db.prepare('UPDATE contact_messages SET is_read = ? WHERE id = ?').run(nextStatus, req.params.id);
  res.json({ success: true, is_read: nextStatus, message: `Marked as ${nextStatus ? 'read' : 'unread'}` });
});

// Admin: Delete message
router.delete('/:id', authenticateAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM contact_messages WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Message not found' });
  }
  res.json({ success: true, message: 'Message deleted' });
});

module.exports = router;

