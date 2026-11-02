const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

async function testConnection() {
  if (!supabase) {
    return {
      configured: false,
      connected: false,
      message: 'No SUPABASE_URL or SUPABASE_KEY detected in environment. Using high-availability local storage.'
    };
  }

  try {
    const { data, error } = await supabase.from('clinic_settings').select('key').limit(1);
    if (error) {
      return {
        configured: true,
        connected: false,
        error: error.message,
        details: 'Failed to query clinic_settings table. Please make sure the schema in supabase_schema.sql has been run in Supabase SQL Editor.'
      };
    }
    return {
      configured: true,
      connected: true,
      message: 'Supabase connected and operational'
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      error: err.message
    };
  }
}

module.exports = {
  supabase,
  isConfigured: () => Boolean(supabase),
  testConnection
};
