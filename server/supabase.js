const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });
    console.log('[Supabase] Initialized client connected to:', SUPABASE_URL);
  } catch (err) {
    console.warn('[Supabase] Failed to initialize client:', err.message);
  }
} else {
  console.log('[Supabase] No SUPABASE_URL / SUPABASE_ANON_KEY found in environment. Using high-availability fallback store.');
}

module.exports = {
  supabase,
  isConfigured: () => Boolean(supabase)
};

