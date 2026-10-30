const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { generateToken, authenticateAdmin } = require('../auth');

const router = express.Router();

// Admin Login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username/Email and Password are required' });
    }

    const query = db.prepare('SELECT * FROM admins WHERE username = ? OR email = ?');
    const admin = query.get(username.trim(), username.trim());

    if (!admin) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = bcrypt.compareSync(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(admin);
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        avatar: admin.avatar
      }
    });
  } catch (err) {
    console.error('[Admin Login Error]', err);
    res.status(500).json({ error: `Login error: ${err.message}` });
  }
});

// Admin Verify / Me
router.get('/me', authenticateAdmin, (req, res) => {
  const admin = db.prepare('SELECT id, username, email, name, role, avatar FROM admins WHERE id = ?').get(req.admin.id);
  if (!admin) {
    return res.status(404).json({ error: 'Admin not found' });
  }
  res.json({ success: true, admin });
});

// Update Profile
router.put('/profile', authenticateAdmin, (req, res) => {
  const { name, email, avatar } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    db.prepare('UPDATE admins SET name = ?, email = ?, avatar = ? WHERE id = ?')
      .run(name, email, avatar || null, req.admin.id);
    
    const updated = db.prepare('SELECT id, username, email, name, role, avatar FROM admins WHERE id = ?').get(req.admin.id);
    res.json({ success: true, admin: updated, message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password
router.put('/change-password', authenticateAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current and new passwords are required' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  if (!admin || !bcrypt.compareSync(currentPassword, admin.password_hash)) {
    return res.status(400).json({ error: 'Incorrect current password' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, req.admin.id);

  res.json({ success: true, message: 'Password changed successfully' });
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;

