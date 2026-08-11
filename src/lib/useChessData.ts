import { useCallback, useEffect, useState } from 'react';
import type { StoredAnalysis, StoredGame } from './types';
import { loadAnalyses, loadGames } from './storage';

export function useChessData() {
  const [games, setGames] = useState<StoredGame[]>([]);
  const [analyses, setAnalyses] = useState<StoredAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextGames, nextAnalyses] = await Promise.all([loadGames(), loadAnalyses()]);
      setGames(nextGames);
      setAnalyses(nextAnalyses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load chess data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { games, analyses, loading, error, refresh };
}
