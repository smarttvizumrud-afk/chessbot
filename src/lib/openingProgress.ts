import { isGuestMode } from './guestSession';
import { supabase } from './supabase';

export type OpeningProgress = {
  id: string;
  opening: string;
  variant: string;
  successfulAttempts: number;
  errorCount: number;
  status: 'training' | 'completed';
  lastTrainedAt: string;
};

type ProgressRow = {
  id: string;
  opening: string;
  variant: string;
  successful_attempts: number;
  error_count: number;
  status: 'training' | 'completed';
  last_trained_at: string;
};

export async function loadOpeningProgress() {
  if (isGuestMode()) return [];
  const { data, error } = await supabase
    .from('opening_variant_progress')
    .select('*')
    .order('last_trained_at', { ascending: false });
  if (isMissingProgressTable(error)) return [];
  if (error) throw error;
  return (data as ProgressRow[]).map(mapProgressRow);
}

export async function saveOpeningAttempt(input: {
  opening: string;
  variant: string;
  successfulAttempts: number;
  errorCount: number;
}) {
  const status: ProgressRow['status'] = input.successfulAttempts >= 3 ? 'completed' : 'training';
  const progress = {
    opening: input.opening,
    variant: input.variant,
    successful_attempts: Math.min(3, input.successfulAttempts),
    error_count: input.errorCount,
    status,
    last_trained_at: new Date().toISOString(),
  };

  if (isGuestMode()) return mapProgressRow({ id: crypto.randomUUID(), ...progress });
  const { data, error } = await supabase
    .from('opening_variant_progress')
    .upsert(progress, { onConflict: 'user_id,opening,variant' })
    .select('*')
    .single();
  if (error) throw error;
  return mapProgressRow(data as ProgressRow);
}

function mapProgressRow(row: ProgressRow): OpeningProgress {
  return {
    id: row.id,
    opening: row.opening,
    variant: row.variant,
    successfulAttempts: row.successful_attempts,
    errorCount: row.error_count,
    status: row.status,
    lastTrainedAt: row.last_trained_at,
  };
}

function isMissingProgressTable(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const value = error as { code?: unknown; message?: unknown };
  return value.code === '42P01' || (typeof value.message === 'string' && value.message.includes('opening_variant_progress'));
}
