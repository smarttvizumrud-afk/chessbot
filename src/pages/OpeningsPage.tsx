import { useEffect, useMemo, useState } from 'react';
import { AuthGate } from '../components/AuthGate';
import { openingRecommendationText, t } from '../lib/i18n';
import { openingStats } from '../lib/insights';
import { loadPinnedOpenings, pinOpening, unpinOpening } from '../lib/pinnedOpenings';
import type { BoardStyle, Lang, PieceStyle } from '../lib/types';
import { useChessData } from '../lib/useChessData';

export function OpeningsPage({ lang }: { lang: Lang; boardStyle: BoardStyle; pieceStyle: PieceStyle }) {
  return (
    <AuthGate lang={lang}>
      <OpeningsContent lang={lang} />
    </AuthGate>
  );
}

function OpeningsContent({ lang }: { lang: Lang }) {
  const { games, analyses, loading } = useChessData();
  const [pinned, setPinned] = useState<string[]>([]);
  const [busyOpening, setBusyOpening] = useState('');
  const [pinError, setPinError] = useState('');
  const pinnedSet = useMemo(() => new Set(pinned), [pinned]);
  const openings = useMemo(() => {
    return openingStats(games, analyses).sort((a, b) => Number(pinnedSet.has(b.opening)) - Number(pinnedSet.has(a.opening)));
  }, [analyses, games, pinnedSet]);

  useEffect(() => {
    loadPinnedOpenings()
      .then((items) => setPinned(items.map((item) => item.opening)))
      .catch(() => setPinError(pinErrorText[lang]));
  }, [lang]);

  async function togglePinned(opening: string) {
    setBusyOpening(opening);
    setPinError('');
    try {
      if (pinnedSet.has(opening)) {
        await unpinOpening(opening);
        setPinned((items) => items.filter((item) => item !== opening));
      } else {
        await pinOpening(opening);
        setPinned((items) => [opening, ...items]);
      }
    } catch {
      setPinError(pinErrorText[lang]);
    } finally {
      setBusyOpening('');
    }
  }

  return (
    <section className="panel">
      <h1>{t(lang, 'openingReport')}</h1>
      {loading && <p>{t(lang, 'loading')}</p>}
      {pinError && <p className="message">{pinError}</p>}
      {!loading && !openings.length && <p>{t(lang, 'noOpenings')}</p>}
      <div className="table">
        {openings.map((item) => (
          <article className={pinnedSet.has(item.opening) ? 'table-row pinned-opening' : 'table-row'} key={item.opening}>
            <div>
              <strong>{item.opening}</strong>
              <p>{openingRecommendationText(lang, item.opening, item.score, item.errors)}</p>
            </div>
            <span>{item.games} {t(lang, 'games').toLowerCase()}</span>
            <span>{item.score || '-'}%</span>
            <span>{item.errors} {t(lang, 'errors')}</span>
            <button type="button" onClick={() => togglePinned(item.opening)} disabled={busyOpening === item.opening}>
              {pinnedSet.has(item.opening) ? unpinText[lang] : pinText[lang]}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

const pinText: Record<Lang, string> = {
  ru: '\u0417\u0430\u043a\u0440\u0435\u043f\u0438\u0442\u044c',
  en: 'Pin',
  kk: '\u0411\u0435\u043a\u0456\u0442\u0443',
};

const unpinText: Record<Lang, string> = {
  ru: '\u041e\u0442\u043a\u0440\u0435\u043f\u0438\u0442\u044c',
  en: 'Unpin',
  kk: '\u0410\u043b\u0443',
};

const pinErrorText: Record<Lang, string> = {
  ru: '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0437\u0430\u043a\u0440\u0435\u043f\u043b\u0435\u043d\u0438\u0435.',
  en: 'Could not save pinned opening.',
  kk: '\u0411\u0435\u043a\u0456\u0442\u0443\u0434\u0456 \u0441\u0430\u049b\u0442\u0430\u0443 \u043c\u04af\u043c\u043a\u0456\u043d \u0431\u043e\u043b\u043c\u0430\u0434\u044b.',
};
