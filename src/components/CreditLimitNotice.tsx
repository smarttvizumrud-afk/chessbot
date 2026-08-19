import { Link } from 'wouter';
import type { Lang } from '../lib/types';

type Props = {
  lang: Lang;
  kind: 'analysis' | 'tournament';
  remaining?: number;
};

export function CreditLimitNotice({ lang, kind, remaining }: Props) {
  return (
    <div className="credit-limit-notice">
      <p>{limitText(lang, kind, remaining)}</p>
      <Link href="/pricing" className="account-link">
        {buyText(lang)}
      </Link>
    </div>
  );
}

function limitText(lang: Lang, kind: Props['kind'], remaining?: number) {
  if (lang === 'en') {
    if (remaining && remaining > 0) {
      return `Credits are empty. You can still analyse ${remaining} free game(s) today.`;
    }
    return kind === 'tournament'
      ? 'Credits are empty. The free tournament recording limit is over for today.'
      : 'Credits are empty. The free analysis limit is over for today.';
  }
  if (lang === 'kk') {
    if (remaining && remaining > 0) {
      return `Kreditter bittti. Bugin tagy ${remaining} partiany tegin taldauga bolady.`;
    }
    return kind === 'tournament'
      ? 'Kreditter bittti. Bugin turnir partiasyn tegin zhazhu limiti ayaqtaldy.'
      : 'Kreditter bittti. Bugin tegin taldau limiti ayaqtaldy.';
  }
  if (remaining && remaining > 0) {
    return `\u041a\u0440\u0435\u0434\u0438\u0442\u044b \u0437\u0430\u043a\u043e\u043d\u0447\u0438\u043b\u0438\u0441\u044c. \u0421\u0435\u0433\u043e\u0434\u043d\u044f \u043c\u043e\u0436\u043d\u043e \u0435\u0449\u0451 \u043f\u0440\u043e\u0430\u043d\u0430\u043b\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u0442\u044c ${remaining} \u043f\u0430\u0440\u0442\u0438\u0439 \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e.`;
  }
  return kind === 'tournament'
    ? '\u041a\u0440\u0435\u0434\u0438\u0442\u044b \u0437\u0430\u043a\u043e\u043d\u0447\u0438\u043b\u0438\u0441\u044c. \u041b\u0438\u043c\u0438\u0442 \u043d\u0430 \u0437\u0430\u043f\u0438\u0441\u044c \u0442\u0443\u0440\u043d\u0438\u0440\u043d\u044b\u0445 \u043f\u0430\u0440\u0442\u0438\u0439 \u043d\u0430 \u0441\u0435\u0433\u043e\u0434\u043d\u044f \u0437\u0430\u043a\u043e\u043d\u0447\u0438\u043b\u0441\u044f.'
    : '\u041a\u0440\u0435\u0434\u0438\u0442\u044b \u0437\u0430\u043a\u043e\u043d\u0447\u0438\u043b\u0438\u0441\u044c. \u041b\u0438\u043c\u0438\u0442 \u043d\u0430 10 \u0430\u043d\u0430\u043b\u0438\u0437\u043e\u0432 \u0432 \u0434\u0435\u043d\u044c \u0443\u0436\u0435 \u0438\u0441\u0447\u0435\u0440\u043f\u0430\u043d.';
}

function buyText(lang: Lang) {
  if (lang === 'en') return 'Buy more';
  if (lang === 'kk') return 'Tagy satyp alu';
  return '\u041a\u0443\u043f\u0438\u0442\u044c \u0435\u0449\u0451';
}
