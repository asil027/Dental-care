const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../auth');

const router = express.Router();

// Public: Get all CMS content
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT section_key, data_json FROM cms_content').all();
  const cms = {};
  for (const row of rows) {
    try {
      cms[row.section_key] = JSON.parse(row.data_json);
    } catch (e) {
      cms[row.section_key] = row.data_json;
    }
  }
  res.json({ success: true, cms });
});

// Admin: Update CMS section
router.put('/:section_key', authenticateAdmin, (req, res) => {
  const { section_key } = req.params;
  const data = req.body;

  const dataStr = typeof data === 'string' ? data : JSON.stringify(data);

  const upsert = db.prepare(`
    INSERT INTO cms_content (section_key, data_json)
    VALUES (?, ?)
    ON CONFLICT(section_key) DO UPDATE SET data_json = excluded.data_json
  `);

  upsert.run(section_key, dataStr);

  res.json({
    success: true,
    section_key,
    data,
    message: `CMS Section '${section_key}' updated successfully`
  });
});

module.exports = router;

