const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../auth');
const { supabase } = require('../supabase');

const router = express.Router();

// Public: Get approved testimonials
router.get('/', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_approved', 1)
        .order('id', { ascending: false });
      if (!error && data && data.length > 0) {
        return res.json({ success: true, testimonials: data });
      }
    } catch (e) {
      console.warn('[Supabase Testimonials Error]', e.message);
    }
  }

  const list = db.prepare('SELECT * FROM testimonials WHERE is_approved = 1 ORDER BY id DESC').all();
  res.json({ success: true, testimonials: list });
});

// Public: Submit patient review (stored with is_approved = 1 so it appears live immediately)
router.post('/submit', async (req, res) => {
  try {
    const { patient_name, photo, rating = 5.0, treatment, review_text } = req.body;
    if (!patient_name || !review_text) {
      return res.status(400).json({ error: 'Please provide your name and review message.' });
    }

    const cleanRating = Math.max(1, Math.min(5, parseFloat(rating) || 5.0));
    const defaultPhoto = photo ? photo.trim() : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
    const cleanTreatment = treatment ? treatment.trim() : 'General Dental Treatment';

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .insert([{
            patient_name: patient_name.trim(),
            photo: defaultPhoto,
            rating: cleanRating,
            treatment: cleanTreatment,
            review_text: review_text.trim(),
            is_approved: 1
          }])
          .select()
          .single();

        if (!error && data) {
          return res.status(201).json({
            success: true,
            message: 'Thank you for your review! It is now live on our website.',
            testimonial: data
          });
        }
      } catch (e) {
        console.warn('[Supabase Testimonial Insert Error]', e.message);
      }
    }

    const result = db.prepare(`
      INSERT INTO testimonials (patient_name, photo, rating, treatment, review_text, is_approved)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(
      patient_name.trim(),
      defaultPhoto,
      cleanRating,
      cleanTreatment,
      review_text.trim()
    );

    const created = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      success: true,
      message: 'Thank you for your review! It is now live on our website.',
      testimonial: created
    });
  } catch (err) {
    console.error('[Submit Review Error]', err);
    res.status(500).json({ error: `Failed to submit review: ${err.message}` });
  }
});

// Admin: Get all testimonials
router.get('/all', authenticateAdmin, async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('id', { ascending: false });
      if (!error && data && data.length > 0) {
        return res.json({ success: true, testimonials: data });
      }
    } catch (e) {
      console.warn('[Supabase All Testimonials Error]', e.message);
    }
  }

  const list = db.prepare('SELECT * FROM testimonials ORDER BY id DESC').all();
  res.json({ success: true, testimonials: list });
});

// Admin: Add testimonial
router.post('/', authenticateAdmin, async (req, res) => {
  const { patient_name, photo, rating = 5.0, treatment, review_text } = req.body;
  if (!patient_name || !review_text) {
    return res.status(400).json({ error: 'Patient name and review text are required' });
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .insert([{
          patient_name: patient_name.trim(),
          photo: photo || null,
          rating: parseFloat(rating) || 5.0,
          treatment: treatment || 'General Dental Treatment',
          review_text: review_text.trim(),
          is_approved: 1
        }])
        .select()
        .single();
      if (!error && data) {
        return res.status(201).json({ success: true, testimonial: data, message: 'Review added' });
      }
    } catch (e) {}
  }

  const result = db.prepare(`
    INSERT INTO testimonials (patient_name, photo, rating, treatment, review_text, is_approved)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(
    patient_name.trim(),
    photo || null,
    parseFloat(rating) || 5.0,
    treatment || 'General Dental Treatment',
    review_text.trim()
  );

  const created = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, testimonial: created, message: 'Review added' });
});

// Admin: Edit testimonial
router.put('/:id', authenticateAdmin, async (req, res) => {
  const { patient_name, photo, rating, treatment, review_text, is_approved } = req.body;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .update({
          ...(patient_name ? { patient_name } : {}),
          ...(photo !== undefined ? { photo } : {}),
          ...(rating !== undefined ? { rating: parseFloat(rating) } : {}),
          ...(treatment !== undefined ? { treatment } : {}),
          ...(review_text ? { review_text } : {}),
          ...(is_approved !== undefined ? { is_approved: is_approved ? 1 : 0 } : {})
        })
        .eq('id', req.params.id)
        .select()
        .single();
      if (!error && data) {
        return res.json({ success: true, testimonial: data, message: 'Review updated' });
      }
    } catch (e) {}
  }

  const current = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(req.params.id);
  if (!current) {
    return res.status(404).json({ error: 'Review not found' });
  }

  db.prepare(`
    UPDATE testimonials
    SET patient_name = ?, photo = ?, rating = ?, treatment = ?, review_text = ?, is_approved = ?
    WHERE id = ?
  `).run(
    patient_name || current.patient_name,
    photo !== undefined ? photo : current.photo,
    rating !== undefined ? parseFloat(rating) : current.rating,
    treatment !== undefined ? treatment : current.treatment,
    review_text || current.review_text,
    is_approved !== undefined ? (is_approved ? 1 : 0) : current.is_approved,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(req.params.id);
  res.json({ success: true, testimonial: updated, message: 'Review updated' });
});

// Admin: Toggle approval status
router.patch('/:id/toggle-approve', authenticateAdmin, async (req, res) => {
  let currentApproved = 1;

  if (supabase) {
    try {
      const { data } = await supabase.from('testimonials').select('is_approved').eq('id', req.params.id).single();
      if (data) {
        currentApproved = data.is_approved;
        const nextStatus = currentApproved ? 0 : 1;
        await supabase.from('testimonials').update({ is_approved: nextStatus }).eq('id', req.params.id);
        return res.json({ success: true, is_approved: nextStatus, message: `Review ${nextStatus ? 'published' : 'hidden'}` });
      }
    } catch (e) {}
  }

  const current = db.prepare('SELECT is_approved FROM testimonials WHERE id = ?').get(req.params.id);
  if (!current) {
    return res.status(404).json({ error: 'Review not found' });
  }

  const nextStatus = current.is_approved ? 0 : 1;
  db.prepare('UPDATE testimonials SET is_approved = ? WHERE id = ?').run(nextStatus, req.params.id);
  res.json({ success: true, is_approved: nextStatus, message: `Review ${nextStatus ? 'published' : 'hidden'}` });
});

// Admin: Delete testimonial
router.delete('/:id', authenticateAdmin, async (req, res) => {
  if (supabase) {
    try {
      await supabase.from('testimonials').delete().eq('id', req.params.id);
    } catch (e) {}
  }

  const result = db.prepare('DELETE FROM testimonials WHERE id = ?').run(req.params.id);
  if (result.changes === 0 && !supabase) {
    return res.status(404).json({ error: 'Review not found' });
  }
  res.json({ success: true, message: 'Review deleted' });
});

module.exports = router;

