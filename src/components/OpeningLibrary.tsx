import { openingVariants } from '../lib/openingVariants';
import type { Lang } from '../lib/types';

type Props = {
  lang: Lang;
  onTrain: (id: string) => void;
};

export function OpeningLibrary({ lang, onTrain }: Props) {
  return (
    <>
      <h2 className="opening-library-title">{libraryTitle[lang]}</h2>
      <div className="table">
        {openingVariants.map((variant) => (
          <article className="table-row" key={variant.id}>
            <div>
              <strong>{variant.opening}: {variant.variant}</strong>
              <p>{variant.ideas}</p>
            </div>
            <span>{variant.userSide === 'white' ? sideText[lang].white : sideText[lang].black}</span>
            <span>{variant.moves.length} {movesText[lang]}</span>
            <button type="button" onClick={() => onTrain(variant.id)}>
              {trainText[lang]}
            </button>
          </article>
        ))}
      </div>
    </>
  );
}

const libraryTitle: Record<Lang, string> = {
  ru: 'Библиотека дебютов и ловушек',
  en: 'Opening and trap library',
  kk: 'Дебюттер мен тұзақтар кітапханасы',
};

const sideText: Record<Lang, { white: string; black: string }> = {
  ru: { white: 'за белых', black: 'за чёрных' },
  en: { white: 'as White', black: 'as Black' },
  kk: { white: 'ақтармен', black: 'қаралармен' },
};

const movesText: Record<Lang, string> = {
  ru: 'ходов',
  en: 'moves',
  kk: 'жүріс',
};

const trainText: Record<Lang, string> = {
  ru: 'Тренировать',
  en: 'Train',
  kk: 'Жаттығу',
};
