import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

const memoryStorage = new Map<string, string>();

const authStorage = {
  getItem(key: string) {
    return window.sessionStorage.getItem(key) ?? memoryStorage.get(key) ?? null;
  },
  setItem(key: string, value: string) {
    memoryStorage.set(key, value);
    window.sessionStorage.setItem(key, value);
  },
  removeItem(key: string) {
    memoryStorage.delete(key);
    window.sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(
  url ?? 'https://not-configured.supabase.co',
  anonKey ?? 'not-configured',
  {
    auth: {
      storage: authStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
