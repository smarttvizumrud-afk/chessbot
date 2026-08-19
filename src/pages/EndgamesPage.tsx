import { AuthGate } from '../components/AuthGate';
import { endgameCopy, endgameGroups } from '../lib/endgameCatalog';
import type { Lang } from '../lib/types';

export function EndgamesPage({ lang }: { lang: Lang }) {
  const labels = endgameCopy[lang];

  return (
    <AuthGate lang={lang}>
      <div className="page-grid">
        <section className="panel training-hero">
          <h1>{labels.title}</h1>
          <p>{labels.subtitle}</p>
        </section>
        {endgameGroups[lang].map((group) => (
          <section className="panel endgame-section" key={group.title}>
            <h2>{group.title}</h2>
            <div className="training-grid endgame-grid">
              {group.cards.map((card) => (
                <article className="training-card" key={card.title}>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                  <strong>{labels.drill}</strong>
                  <p>{card.drill}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AuthGate>
  );
}
