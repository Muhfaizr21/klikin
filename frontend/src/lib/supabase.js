import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabasePublishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
const isRealtimeEnabled = import.meta.env.VITE_ENABLE_SUPABASE_REALTIME === 'true';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

const createNoopChannel = () => {
  const ch = {
    on: () => ch,
    subscribe: () => ch,
    unsubscribe: () => Promise.resolve(),
  };
  return ch;
};

const fallbackSupabaseClient = {
  auth: {
    signInWithOAuth: async () => ({
      data: null,
      error: new Error('Integrasi OAuth belum dikonfigurasi pada environment server ini.'),
    }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  channel: () => createNoopChannel(),
  removeChannel: () => Promise.resolve(),
};

const buildSupabaseClient = () => {
  if (!isSupabaseConfigured) return fallbackSupabaseClient;
  const client = createClient(supabaseUrl, supabasePublishableKey);
  if (!isRealtimeEnabled) {
    client.channel = () => createNoopChannel();
    client.removeChannel = () => Promise.resolve();
  }
  return client;
};

export const supabase = buildSupabaseClient();

