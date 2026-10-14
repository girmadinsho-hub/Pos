// ═══ SMARTSHOP PRO — CENTRAL CONFIGURATION ═══
// Layer 1: Technical keys only. Business info (contacts, prices) lives in
// the Master app → database. This file changes ~once a year.
var SS_CONFIG = {
  SUPABASE_URL: 'https://mtwcdvmdoxzcejzgypdw.supabase.co',
  SUPABASE_KEY: 'sb_publishable_FkTC2_MtgqDkDPuZmjDsag_2uOmsnq8',
  TURN: { urls: ['turn:standard.relay.metered.ca:80', 'turn:standard.relay.metered.ca:443', 'turn:standard.relay.metered.ca:443?transport=tcp'], username: '5097ed41ead6fae0a318221d', credential: 'LcC3X8UytG56Ep13' },
  SUPPORT: {   // emergency fallback only — real values come from Master app
    phone: '+251973316100',
    whatsapp: '251973316100',
    email: 'girmadinsho@gmail.com'
  }
};
