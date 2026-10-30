const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../auth');

const router = express.Router();

// Public: Get all active services
router.get('/', (req, res) => {
  const services = db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY order_index ASC, id ASC').all();
  res.json({ success: true, services });
});

// Admin: Get all services
router.get('/all', authenticateAdmin, (req, res) => {
  const services = db.prepare('SELECT * FROM services ORDER BY order_index ASC, id ASC').all();
  res.json({ success: true, services });
});

// Get single service
router.get('/:id', (req, res) => {
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }
  res.json({ success: true, service });
});

// Admin: Add service
router.post('/', authenticateAdmin, (req, res) => {
  const {
    name,
    icon = 'Stethoscope',
    short_desc,
    full_desc,
    price = 2500,
    duration_mins = 45,
    image,
    order_index = 0
  } = req.body;

  if (!name || !short_desc) {
    return res.status(400).json({ error: 'Name and short description are required' });
  }

  const result = db.prepare(`
    INSERT INTO services (name, icon, short_desc, full_desc, price, duration_mins, image, is_active, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    name.trim(),
    icon,
    short_desc.trim(),
    full_desc || short_desc,
    parseInt(price, 10) || 2500,
    parseInt(duration_mins, 10) || 45,
    image || null,
    parseInt(order_index, 10) || 0
  );

  const created = db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, service: created, message: 'Service added successfully' });
});

// Admin: Update service
router.put('/:id', authenticateAdmin, (req, res) => {
  const {
    name,
    icon,
    short_desc,
    full_desc,
    price,
    duration_mins,
    image,
    is_active,
    order_index
  } = req.body;

  const current = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!current) {
    return res.status(404).json({ error: 'Service not found' });
  }

  db.prepare(`
    UPDATE services
    SET name = ?, icon = ?, short_desc = ?, full_desc = ?,
        price = ?, duration_mins = ?, image = ?,
        is_active = ?, order_index = ?
    WHERE id = ?
  `).run(
    name || current.name,
    icon || current.icon,
    short_desc || current.short_desc,
    full_desc !== undefined ? full_desc : current.full_desc,
    price !== undefined ? parseInt(price, 10) : current.price,
    duration_mins !== undefined ? parseInt(duration_mins, 10) : current.duration_mins,
    image !== undefined ? image : current.image,
    is_active !== undefined ? (is_active ? 1 : 0) : current.is_active,
    order_index !== undefined ? parseInt(order_index, 10) : current.order_index,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  res.json({ success: true, service: updated, message: 'Service updated successfully' });
});

// Admin: Toggle visibility
router.patch('/:id/toggle-status', authenticateAdmin, (req, res) => {
  const current = db.prepare('SELECT is_active FROM services WHERE id = ?').get(req.params.id);
  if (!current) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const nextStatus = current.is_active ? 0 : 1;
  db.prepare('UPDATE services SET is_active = ? WHERE id = ?').run(nextStatus, req.params.id);
  res.json({ success: true, is_active: nextStatus, message: `Service visibility ${nextStatus ? 'enabled' : 'hidden'}` });
});

// Admin: Delete service
router.delete('/:id', authenticateAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Service not found' });
  }
  res.json({ success: true, message: 'Service removed successfully' });
});

module.exports = router;

