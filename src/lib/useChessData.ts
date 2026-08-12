import { useCallback, useEffect, useState } from 'react';
import type { StoredAnalysis, StoredGame, StoredProfile } from './types';
import { loadAnalyses, loadGames, loadProfiles } from './storage';

export function useChessData() {
  const [games, setGames] = useState<StoredGame[]>([]);
  const [analyses, setAnalyses] = useState<StoredAnalysis[]>([]);
  const [profiles, setProfiles] = useState<StoredProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextGames, nextAnalyses, nextProfiles] = await Promise.all([
        loadGames(),
        loadAnalyses(),
        loadProfiles(),
      ]);
      setGames(nextGames);
      setAnalyses(nextAnalyses);
      setProfiles(nextProfiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load chess data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { games, analyses, profiles, loading, error, refresh };
}
