let app;
let initError = null;

try {
  app = require('../server/index');
} catch (err) {
  initError = err;
  console.error('[Dental Care Vercel Serverless] Initialization error:', err);
}

module.exports = (req, res) => {
  if (initError) {
    console.error('[Dental Care Vercel Serverless] Responding with init error:', initError);
    return res.status(500).json({
      error: `Server startup error: ${initError.message}`
    });
  }
  return app(req, res);
};
