import { useState } from 'react';
import { analyzeGame } from '../lib/analyzer';
import { hasActiveSubscription, loadBillingState } from '../lib/credits';
import { FREE_DAILY_ANALYSIS_LIMIT, loadDailyUsage } from '../lib/dailyLimits';
import { fetchPlatformGames, fetchPlatformRatings } from '../lib/platforms';
import { generatePuzzleForGame } from '../lib/puzzleGenerator';
import { savePuzzleGenerationResult } from '../lib/puzzles';
import { saveAnalysis, saveGame, saveProfile } from '../lib/storage';
import { StockfishClient } from '../lib/stockfish';
import type { Lang, Platform } from '../lib/types';
import { t } from '../lib/i18n';
import { CreditLimitNotice } from './CreditLimitNotice';
import { TournamentGameForm } from './TournamentGameForm';

type Props = { lang: Lang; onDone: () => Promise<void> };
type Range = '10' | '25' | '50' | '100' | 'week' | 'month' | 'quarter';

export function ConnectPanel({ lang, onDone }: Props) {
  const [platform, setPlatform] = useState<Platform>('lichess');
  const [username, setUsername] = useState('');
  const [range, setRange] = useState<Range>('10');
  const [status, setStatus] = useState('');
  const [limitNotice, setLimitNotice] = useState<{ kind: 'analysis'; remaining?: number } | null>(null);
  const [busy, setBusy] = useState(false);

  async function runImport(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setLimitNotice(null);
    const engine = new StockfishClient();
    setStatus(t(lang, 'loadingGames'));
    try {
      const allowance = await loadAnalysisAllowance();
      if (allowance.allowedGames <= 0) {
        setLimitNotice({ kind: 'analysis' });
        setStatus('');
        return;
      }
      if (allowance.isFreeMode) {
        setLimitNotice({ kind: 'analysis', remaining: allowance.allowedGames });
      }
      const ratings = await fetchPlatformRatings(platform, username);
      await saveProfile(ratings);
      const games = await fetchPlatformGames(toOptions(platform, username, range, allowance.allowedGames));
      if (!games.length) {
        setStatus(t(lang, 'noData'));
        return;
      }

      let analysedCount = 0;
      let skippedCount = 0;
      for (const [index, game] of games.entries()) {
        setStatus(`${t(lang, 'analysing')} ${index + 1}/${games.length}: ${game.opponent}`);
        try {
          const stored = await saveGame(game);
          const analysis = await analyzeGame(game, engine);
          const storedAnalysis = await saveAnalysis(stored.id, analysis);
          const puzzleResult = generatePuzzleForGame(stored, storedAnalysis);
          await savePuzzleGenerationResult(puzzleResult);
          analysedCount += 1;
        } catch {
          skippedCount += 1;
        }
      }
      await onDone();
      const skippedText = skippedCount ? `, ${skippedCount} skipped` : '';
      setStatus(`${t(lang, 'ready')}: ${analysedCount} ${t(lang, 'analysed')}${skippedText}.`);
    } catch (error) {
      const details = error instanceof Error ? ` ${error.message}` : '';
      setStatus(`${t(lang, 'analysisFailed')}${details}`);
    } finally {
      engine.stop();
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>{t(lang, 'connect')}</h2>
      <form className="coach-form" onSubmit={runImport}>
        <select value={platform} onChange={(event) => setPlatform(event.target.value as Platform)}>
          <option value="lichess">Lichess</option>
          <option value="chesscom">Chess.com</option>
        </select>
        <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder={t(lang, 'username')} required />
        <select value={range} onChange={(event) => setRange(event.target.value as Range)}>
          <option value="10">{t(lang, 'last10')}</option>
          <option value="25">{t(lang, 'last25')}</option>
          <option value="50">{t(lang, 'last50')}</option>
          <option value="100">{t(lang, 'last100')}</option>
          <option value="week">{t(lang, 'week')}</option>
          <option value="month">{t(lang, 'month')}</option>
          <option value="quarter">{t(lang, 'quarter')}</option>
        </select>
        <button type="submit" disabled={busy}>{busy ? '...' : t(lang, 'import')}</button>
      </form>
      <TournamentGameForm lang={lang} onDone={onDone} />
      {limitNotice && <CreditLimitNotice lang={lang} kind={limitNotice.kind} remaining={limitNotice.remaining} />}
      {status && <p className="message">{status}</p>}
    </section>
  );
}

async function loadAnalysisAllowance() {
  const [billing, usage] = await Promise.all([loadBillingState(), loadDailyUsage()]);
  const isFreeMode = billing.balance <= 0 && !hasActiveSubscription(billing);
  return {
    allowedGames: isFreeMode
      ? Math.max(FREE_DAILY_ANALYSIS_LIMIT - usage.analyses, 0)
      : Number.POSITIVE_INFINITY,
    isFreeMode,
  };
}

function toOptions(platform: Platform, username: string, range: Range, allowedGames: number) {
  const days = range === 'week' ? 7 : range === 'month' ? 30 : range === 'quarter' ? 90 : 0;
  return {
    platform,
    username,
    limit: Math.min(importLimit(range), allowedGames),
    since: days ? new Date(Date.now() - days * 86_400_000).toISOString() : undefined,
  };
}

function importLimit(range: Range) {
  if (range === 'week') return 25;
  if (range === 'month') return 30;
  if (range === 'quarter') return 100;
  return Number(range);
}
