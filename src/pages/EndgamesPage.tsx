import { useState } from 'react';
import { Link } from 'wouter';
import { AuthGate } from '../components/AuthGate';
import { EndgamePracticeBoard } from '../components/EndgamePracticeBoard';
import { endgameCopy, endgameGroups, type EndgameCard, type EndgameCopy } from '../lib/endgameCatalog';
import { endgameMomentsFromGames, type EndgameMoment } from '../lib/endgameTraining';
import type { Lang } from '../lib/types';
import { useChessData } from '../lib/useChessData';

export function EndgamesPage({ lang }: { lang: Lang }) {
  return (
    <AuthGate lang={lang}>
      <EndgamesContent lang={lang} />
    </AuthGate>
  );
}

function EndgamesContent({ lang }: { lang: Lang }) {
  const labels = endgameCopy[lang];
  const { games, analyses, loading } = useChessData();
  const moments = endgameMomentsFromGames(games, analyses);
  const [activeDrill, setActiveDrill] = useState<EndgameCard | null>(null);

  return (
    <div className="page-grid">
      <section className="panel training-hero">
        <h1>{labels.title}</h1>
        <p>{labels.subtitle}</p>
      </section>
      {activeDrill && (
        <section className="panel endgame-practice">
          <div className="task-header">
            <div>
              <h2>{activeDrill.title}</h2>
              <p>{activeDrill.text}</p>
            </div>
            <button type="button" className="ghost" onClick={() => setActiveDrill(null)}>
              {labels.close}
            </button>
          </div>
          <EndgamePracticeBoard card={activeDrill} lang={lang} />
        </section>
      )}
      <section className="panel generated-tasks">
        <h2>{labels.fromGames}</h2>
        {loading ? (
          <p>{labels.emptyFromGames}</p>
        ) : moments.length > 0 ? (
          <div className="generated-task-grid">
            {moments.map((moment) => (
              <EndgameMomentCard labels={labels} moment={moment} key={moment.id} />
            ))}
          </div>
        ) : (
          <p>{labels.emptyFromGames}</p>
        )}
      </section>
      {endgameGroups[lang].map((group) => (
        <section className="panel endgame-section" key={group.title}>
          <h2>{group.title}</h2>
          <div className="training-grid endgame-grid">
            {group.cards.map((card) => (
              <article className="training-card" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <p>{card.drill}</p>
                <button type="button" onClick={() => setActiveDrill(card)}>
                  {labels.drill}
                </button>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EndgameMomentCard({
  labels,
  moment,
}: {
  labels: EndgameCopy;
  moment: EndgameMoment;
}) {
  return (
    <article className={`generated-task ${moment.label}`}>
      <span>{moment.theme}</span>
      <h3>
        {moment.moveNumber}. {moment.played} vs {moment.opponent}
      </h3>
      <p>{moment.opening}</p>
      <p>
        {labels.played}: {moment.played}. {labels.best}: {moment.bestMove}. -{moment.loss}
      </p>
      <Link className="account-link secondary" href={`/game/${moment.gameId}`}>
        {labels.open}
      </Link>
    </article>
  );
}
