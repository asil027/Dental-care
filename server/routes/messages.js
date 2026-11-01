const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../auth');
const { supabase } = require('../supabase');

const router = express.Router();

// Public: Submit contact form
router.post('/', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required' });
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .insert([{
          name: name.trim(),
          email: email.trim(),
          phone: phone ? phone.trim() : null,
          subject: subject ? subject.trim() : 'General Inquiry',
          message: message.trim(),
          is_read: 0
        }])
        .select()
        .single();
      if (!error && data) {
        return res.status(201).json({
          success: true,
          message: 'Thank you! Your message has been received. Our clinic staff will respond shortly.',
          messageRecord: data
        });
      }
    } catch (e) {
      console.warn('[Supabase Message Insert Error]', e.message);
    }
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
router.get('/', authenticateAdmin, async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('id', { ascending: false });
      if (!error && data && data.length > 0) {
        return res.json({ success: true, messages: data });
      }
    } catch (e) {
      console.warn('[Supabase Messages Fetch Error]', e.message);
    }
  }

  const list = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
  res.json({ success: true, messages: list });
});

// Admin: Mark message as read
router.patch('/:id/read', authenticateAdmin, async (req, res) => {
  if (supabase) {
    try {
      await supabase.from('contact_messages').update({ is_read: 1 }).eq('id', req.params.id);
    } catch (e) {}
  }
  db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Marked as read' });
});

// Admin: Toggle read/unread status
router.patch('/:id/toggle-read', authenticateAdmin, async (req, res) => {
  if (supabase) {
    try {
      const { data } = await supabase.from('contact_messages').select('is_read').eq('id', req.params.id).single();
      if (data) {
        const nextStatus = data.is_read ? 0 : 1;
        await supabase.from('contact_messages').update({ is_read: nextStatus }).eq('id', req.params.id);
        return res.json({ success: true, is_read: nextStatus, message: `Marked as ${nextStatus ? 'read' : 'unread'}` });
      }
    } catch (e) {}
  }

  const current = db.prepare('SELECT is_read FROM contact_messages WHERE id = ?').get(req.params.id);
  if (!current) {
    return res.status(404).json({ error: 'Message not found' });
  }
  const nextStatus = current.is_read ? 0 : 1;
  db.prepare('UPDATE contact_messages SET is_read = ? WHERE id = ?').run(nextStatus, req.params.id);
  res.json({ success: true, is_read: nextStatus, message: `Marked as ${nextStatus ? 'read' : 'unread'}` });
});

// Admin: Delete message
router.delete('/:id', authenticateAdmin, async (req, res) => {
  if (supabase) {
    try {
      await supabase.from('contact_messages').delete().eq('id', req.params.id);
    } catch (e) {}
  }

  const result = db.prepare('DELETE FROM contact_messages WHERE id = ?').run(req.params.id);
  if (result.changes === 0 && !supabase) {
    return res.status(404).json({ error: 'Message not found' });
  }
  res.json({ success: true, message: 'Message deleted' });
});

module.exports = router;

