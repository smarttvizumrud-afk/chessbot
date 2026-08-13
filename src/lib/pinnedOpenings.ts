import { isGuestMode } from './guestSession';
import { supabase } from './supabase';
import type { StoredPinnedOpening } from './types';

type PinnedOpeningRow = {
  id: string;
  opening: string;
  created_at: string;
};

export async function loadPinnedOpenings() {
  if (isGuestMode()) return [];
  const { data, error } = await supabase
    .from('pinned_openings')
    .select('id, opening, created_at')
    .order('created_at', { ascending: false });
  if (isMissingPinnedTable(error)) return [];
  if (error) throw error;
  return (data as PinnedOpeningRow[]).map(mapPinnedOpeningRow);
}

export async function pinOpening(opening: string) {
  if (isGuestMode()) return;
  const { error } = await supabase.from('pinned_openings').upsert({ opening }, { onConflict: 'user_id,opening' });
  if (error) throw error;
}

export async function unpinOpening(opening: string) {
  if (isGuestMode()) return;
  const { error } = await supabase.from('pinned_openings').delete().eq('opening', opening);
  if (error) throw error;
}

function mapPinnedOpeningRow(row: PinnedOpeningRow): StoredPinnedOpening {
  return {
    id: row.id,
    opening: row.opening,
    createdAt: row.created_at,
  };
}

function isMissingPinnedTable(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const value = error as { code?: unknown; message?: unknown };
  return value.code === '42P01' || (typeof value.message === 'string' && value.message.includes('pinned_openings'));
}
