import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

const memoryStorage = new Map<string, string>();

const authStorage = {
  getItem(key: string) {
    return readStorage(window.localStorage, key)
      ?? readStorage(window.sessionStorage, key)
      ?? memoryStorage.get(key)
      ?? null;
  },
  setItem(key: string, value: string) {
    memoryStorage.set(key, value);
    writeStorage(window.localStorage, key, value);
    writeStorage(window.sessionStorage, key, value);
  },
  removeItem(key: string) {
    memoryStorage.delete(key);
    removeStorage(window.localStorage, key);
    removeStorage(window.sessionStorage, key);
  },
};

function readStorage(storage: Storage, key: string) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    // Mobile private browsers can reject persistent storage.
  }
}

function removeStorage(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage cleanup errors.
  }
}

export const supabase = createClient(
  url ?? 'https://not-configured.supabase.co',
  anonKey ?? 'not-configured',
  {
    auth: {
      storage: authStorage,
      persistSession: true,
      autoRefreshToken: true,
      flowType: 'pkce',
      detectSessionInUrl: false,
    },
  },
);
