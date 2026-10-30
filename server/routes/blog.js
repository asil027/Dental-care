const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../auth');

const router = express.Router();

// Helper to make slug
function makeSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

// Public: Get published blog articles
router.get('/', (req, res) => {
  const articles = db.prepare('SELECT * FROM blog_posts WHERE is_published = 1 ORDER BY published_at DESC, id DESC').all();
  res.json({ success: true, articles });
});

// Admin: Get all articles
router.get('/all', authenticateAdmin, (req, res) => {
  const articles = db.prepare('SELECT * FROM blog_posts ORDER BY id DESC').all();
  res.json({ success: true, articles });
});

// Single article by slug or id
router.get('/:identifier', (req, res) => {
  const isNumeric = /^\d+$/.test(req.params.identifier);
  const article = isNumeric
    ? db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.identifier)
    : db.prepare('SELECT * FROM blog_posts WHERE slug = ?').get(req.params.identifier);

  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  res.json({ success: true, article });
});

// Admin: Create article
router.post('/', authenticateAdmin, (req, res) => {
  const { title, category = 'Oral Health', image, short_desc, content, author = 'Dr. Ayesha Khan', read_time = '4 min read', is_published = 1 } = req.body;
  if (!title || !short_desc || !content) {
    return res.status(400).json({ error: 'Title, summary and content are required' });
  }

  const baseSlug = makeSlug(title);
  const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
  const published_at = new Date().toISOString().split('T')[0];

  const result = db.prepare(`
    INSERT INTO blog_posts (title, slug, category, image, short_desc, content, author, read_time, is_published, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title.trim(),
    slug,
    category,
    image || 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80',
    short_desc.trim(),
    content.trim(),
    author,
    read_time,
    is_published ? 1 : 0,
    published_at
  );

  const created = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, article: created, message: 'Article created successfully' });
});

// Admin: Edit article
router.put('/:id', authenticateAdmin, (req, res) => {
  const { title, category, image, short_desc, content, author, read_time, is_published } = req.body;
  const current = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id);
  if (!current) {
    return res.status(404).json({ error: 'Article not found' });
  }

  db.prepare(`
    UPDATE blog_posts
    SET title = ?, category = ?, image = ?, short_desc = ?, content = ?, author = ?, read_time = ?, is_published = ?
    WHERE id = ?
  `).run(
    title || current.title,
    category || current.category,
    image !== undefined ? image : current.image,
    short_desc || current.short_desc,
    content || current.content,
    author || current.author,
    read_time || current.read_time,
    is_published !== undefined ? (is_published ? 1 : 0) : current.is_published,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id);
  res.json({ success: true, article: updated, message: 'Article updated' });
});

// Admin: Toggle publish
router.patch('/:id/toggle-publish', authenticateAdmin, (req, res) => {
  const current = db.prepare('SELECT is_published FROM blog_posts WHERE id = ?').get(req.params.id);
  if (!current) {
    return res.status(404).json({ error: 'Article not found' });
  }

  const nextStatus = current.is_published ? 0 : 1;
  db.prepare('UPDATE blog_posts SET is_published = ? WHERE id = ?').run(nextStatus, req.params.id);
  res.json({ success: true, is_published: nextStatus, message: `Article ${nextStatus ? 'published' : 'unpublished'}` });
});

// Admin: Delete article
router.delete('/:id', authenticateAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM blog_posts WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Article not found' });
  }
  res.json({ success: true, message: 'Article deleted' });
});

module.exports = router;

