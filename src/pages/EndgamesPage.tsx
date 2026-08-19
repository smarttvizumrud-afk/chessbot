import { AuthGate } from '../components/AuthGate';
import type { Lang } from '../lib/types';

type EndgameCard = {
  title: string;
  text: string;
  drill: string;
};

const cards: Record<Lang, EndgameCard[]> = {
  ru: [
    { title: 'Король и пешка', text: 'Пойми правило квадрата и когда король должен идти вперед.', drill: 'Поставь пешку на e5 и найди путь к ферзю.' },
    { title: 'Ладейные эндшпили', text: 'Ладья должна быть активной: за проходной пешкой или сбоку от короля.', drill: 'Разбери ладью за пешкой, боковые шахи и отрезанного короля.' },
    { title: 'Ферзь против пешки', text: 'Сначала загоняй короля шахами, потом забирай пешку.', drill: 'Тренируй позиции, где пешка уже на 7-й линии.' },
  ],
  en: [
    { title: 'King and pawn', text: 'Learn the square rule and when the king must step forward.', drill: 'Put a pawn on e5 and find the path to promotion.' },
    { title: 'Rook endgames', text: 'Keep the rook active: behind the passed pawn or cutting the king.', drill: 'Review rook behind pawn, side checks, and cut-off king positions.' },
    { title: 'Queen vs pawn', text: 'Use checks to push the king away, then win the pawn.', drill: 'Train positions where the pawn is already on the 7th rank.' },
  ],
  kk: [
    { title: 'Korol jane peshka', text: 'Kvadrat erezhesin jane koroldin alga shyguyn tusin.', drill: 'Peshkany e5-ke qoyyp, ferzige jetetin jol tap.' },
    { title: 'Ladialy endshpil', text: 'Ladia belsendi bolsyn: otpeli peshkanyn artinda nemese koroldi kesip tursyn.', drill: 'Ladia peshka artinda, janama shah, kesilgen korol pozitsialaryn kara.' },
    { title: 'Ferzi peshkaga karsy', text: 'Aldymen koroldi shahtarmen qu, sodan son peshkany al.', drill: 'Peshka 7-qatargha jetken pozitsialardy jattyq.' },
  ],
};

const copy: Record<Lang, { title: string; subtitle: string; drill: string }> = {
  ru: { title: 'Эндшпиль', subtitle: 'Короткие тренировки, чтобы не терять выигранные партии в конце.', drill: 'Тренировка' },
  en: { title: 'Endgames', subtitle: 'Short drills so winning positions stay winning.', drill: 'Drill' },
  kk: { title: 'Endshpil', subtitle: 'Utysty pozitsialardy songynda zhogaltpau ushin qysqa jattygular.', drill: 'Jattygu' },
};

export function EndgamesPage({ lang }: { lang: Lang }) {
  const labels = copy[lang];

  return (
    <AuthGate lang={lang}>
      <div className="page-grid">
        <section className="panel training-hero">
          <h1>{labels.title}</h1>
          <p>{labels.subtitle}</p>
        </section>
        <section className="training-grid endgame-grid">
          {cards[lang].map((card) => (
            <article className="training-card" key={card.title}>
              <h2>{card.title}</h2>
              <p>{card.text}</p>
              <strong>{labels.drill}</strong>
              <p>{card.drill}</p>
            </article>
          ))}
        </section>
      </div>
    </AuthGate>
  );
}
