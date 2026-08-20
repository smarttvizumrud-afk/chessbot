import type { Lang } from './types';

export type EndgameGroup = {
  title: string;
  cards: EndgameCard[];
};

export type EndgameCard = {
  title: string;
  text: string;
  drill: string;
};

export type EndgameCopy = {
  title: string;
  subtitle: string;
  drill: string;
  fromGames: string;
  emptyFromGames: string;
  played: string;
  best: string;
  open: string;
  close: string;
};

export const endgameCopy: Record<Lang, EndgameCopy> = {
  ru: {
    title: 'Эндшпиль',
    subtitle: 'Все основные типы окончаний: от пешек до ферзей и матовых схем.',
    drill: 'Тренировка',
    fromGames: 'Эндшпили из твоих партий',
    emptyFromGames: 'Пока в анализах нет эндшпильных ошибок. Загрузи больше партий, которые дошли до конца.',
    played: 'Ты сыграл',
    best: 'Лучше',
    open: 'Открыть партию',
    close: 'Закрыть',
  },
  en: {
    title: 'Endgames',
    subtitle: 'All core endgame types: from pawns to queens and mate patterns.',
    drill: 'Drill',
    fromGames: 'Endgames from your games',
    emptyFromGames: 'No endgame mistakes in analyses yet. Upload more games that reached the endgame.',
    played: 'You played',
    best: 'Better',
    open: 'Open game',
    close: 'Close',
  },
  kk: {
    title: 'Эндшпиль',
    subtitle: 'Негізгі эндшпиль түрлері: пешкадан ферзіге және мат үлгілеріне дейін.',
    drill: 'Жаттығу',
    fromGames: 'Партияларыңдағы эндшпиль',
    emptyFromGames: 'Талдауда эндшпиль қателері әзір жоқ. Соңына дейін жеткен көбірек партия жүкте.',
    played: 'Сен ойнадың',
    best: 'Жақсырақ',
    open: 'Партияны ашу',
    close: 'Жабу',
  },
};

export const endgameGroups: Record<Lang, EndgameGroup[]> = {
  ru: [
    group('Пешечные', [
      card('Король и пешка', 'Правило квадрата, оппозиция и прорыв королём.', 'Поставь пешку на e5 и найди путь к ферзю.'),
      card('Пешечные прорывы', 'Жертва пешки иногда создаёт решающую проходную.', 'Разбери схемы 2 против 2 и 3 против 3 на одном фланге.'),
      card('Отдалённая проходная', 'Проходная далеко от короля отвлекает защиту.', 'Отвлеки короля и выиграй пешки на другом фланге.'),
    ]),
    group('Ладьи и ферзи', [
      card('Ладейные эндшпили', 'Активная ладья важнее пассивной защиты.', 'Тренируй ладью за проходной пешкой и боковые шахи.'),
      card('Ладья против пешек', 'Ладья тормозит пешки сзади или сбоку.', 'Выбери, когда давать шахи, а когда забирать пешку.'),
      card('Ферзевые эндшпили', 'Главное: вечный шах, безопасность короля и проходные.', 'Найди вечный шах в позициях с открытым королём.'),
      card('Ферзь против пешки', 'Шахами отталкивай короля, потом забирай пешку.', 'Тренируй позиции с пешкой на 7-й линии.'),
    ]),
    group('Лёгкие фигуры', [
      card('Слоновые эндшпили', 'Слон силён на открытых диагоналях.', 'Поставь слона за проходной и проверь, держит ли он пешку.'),
      card('Коневые эндшпили', 'Конь любит форпосты и вилки, но плохо догоняет крайние пешки.', 'Найди вилку или маршрут коня к проходной пешке.'),
      card('Разноцветные слоны', 'Лишняя пешка часто не выигрывает без второго слабого места.', 'Создай две слабости на разных флангах.'),
      card('Слон против коня', 'Слон любит открытые позиции, конь любит блокаду.', 'Определи, кому выгоден размен пешек в центре.'),
    ]),
    group('Фигура и пешки', [
      card('Фигура против пешек', 'Считай, успевает ли фигура остановить проходные.', 'Проверь маршрут короля и фигуры против двух связанных пешек.'),
      card('Лишняя фигура', 'Сначала останови контригру и проходные пешки.', 'Найди безопасный способ размена последней опасной пешки.'),
      card('Качество', 'Ладья против слона или коня выигрывает только при активности.', 'Проверь, может ли ладья проникнуть на 7-ю линию.'),
    ]),
    group('Матовые окончания', [
      card('Ферзь и король против короля', 'Отрезай короля рядами и не допускай пата.', 'Поставь мат за 10 ходов без случайного пата.'),
      card('Ладья и король против короля', 'Отрезай короля ладьёй, королём подталкивай к краю.', 'Доведи короля соперника до края и поставь мат.'),
      card('Два слона', 'Слоны режут диагонали, король закрывает выход.', 'Загоняй короля в угол и держи диагонали.'),
      card('Слон и конь', 'Самый трудный базовый мат: гони короля в угол цвета слона.', 'Тренируй схему W и правильный угол.'),
    ]),
  ],
  en: [
    group('Pawn Endgames', [
      card('King and pawn', 'Square rule, opposition, and king breakthrough.', 'Put a pawn on e5 and find the path to promotion.'),
      card('Pawn breaks', 'A pawn sacrifice can create a decisive passer.', 'Review 2 vs 2 and 3 vs 3 flank structures.'),
      card('Outside passer', 'A far passed pawn distracts the defender.', 'Pull the king away, then win pawns on the other side.'),
    ]),
    group('Rooks and Queens', [
      card('Rook endgames', 'Active rook beats passive defense.', 'Train rook behind passed pawn and side checks.'),
      card('Rook vs pawns', 'Stop pawns from behind or from the side.', 'Choose between checks and taking the pawn.'),
      card('Queen endgames', 'Look for perpetual check, king safety, and passers.', 'Find perpetual checks against exposed kings.'),
      card('Queen vs pawn', 'Use checks to push the king away, then win the pawn.', 'Train 7th-rank pawn positions.'),
    ]),
    group('Minor Pieces', [
      card('Bishop endgames', 'Bishops need open diagonals.', 'Place the bishop behind a passer and test if it stops it.'),
      card('Knight endgames', 'Knights love outposts and forks but struggle with rook pawns.', 'Find a fork or knight route to the passer.'),
      card('Opposite bishops', 'One extra pawn often is not enough without a second weakness.', 'Create two weaknesses on both wings.'),
      card('Bishop vs knight', 'Bishop likes open play, knight likes blockade.', 'Decide who benefits from central pawn trades.'),
    ]),
    group('Piece and Pawns', [
      card('Piece vs pawns', 'Calculate whether the piece can stop the passers.', 'Test king and piece routes against connected pawns.'),
      card('Extra piece', 'Stop counterplay before pushing your advantage.', 'Trade the last dangerous pawn safely.'),
      card('Exchange up', 'Rook vs minor piece wins only with activity.', 'Check if the rook can reach the 7th rank.'),
    ]),
    group('Mate Endgames', [
      card('Queen mate', 'Cut the king off and avoid stalemate.', 'Mate in 10 moves without stalemate.'),
      card('Rook mate', 'Cut the king with the rook and drive it to the edge.', 'Push the king to the edge and mate.'),
      card('Two bishops', 'Control diagonals and close exits with the king.', 'Drive the king to a corner while holding diagonals.'),
      card('Bishop and knight', 'The hardest basic mate: drive to the bishop-colored corner.', 'Train the W pattern and the correct corner.'),
    ]),
  ],
  kk: [
    group('Пешкалы эндшпиль', [
      card('Король және пешка', 'Квадрат ережесі, оппозиция және корольдің бұзып кіруі.', 'Пешканы e5-ке қойып, ферзіге өту жолын тап.'),
      card('Пешка бұзып өтуі', 'Пешка құрбаны кейде шешуші өтпелі пешка жасайды.', '2-ге 2 және 3-ке 3 құрылымдарын қара.'),
      card('Алыстағы өтпелі пешка', 'Алыстағы өтпелі пешка қарсы корольді алаңдатады.', 'Корольді алшақтатып, екінші қанаттағы пешкаларды ал.'),
    ]),
    group('Ладья және ферзі', [
      card('Ладьялы эндшпиль', 'Белсенді ладья пассив қорғаныстан күштірек.', 'Ладьяны өтпелі пешканың артына қойып, жанама шахтарды жаттықтыр.'),
      card('Ладья пешкаларға қарсы', 'Пешкаларды артынан немесе жанынан тоқтат.', 'Шах беру керек пе, әлде пешканы алу керек пе - таңда.'),
      card('Ферзилік эндшпиль', 'Мәңгі шах, король қауіпсіздігі және өтпелі пешкалар маңызды.', 'Ашық корольге мәңгі шах таб.'),
      card('Ферзі пешкаға қарсы', 'Шахтармен корольді қуып, содан кейін пешканы ал.', '7-қатардағы пешка позицияларын жаттықтыр.'),
    ]),
    group('Жеңіл фигуралар', [
      card('Піл эндшпилі', 'Піл ашық диагональда күшті.', 'Пілді өтпелі пешканың артына қойып, оны тоқтата ала ма тексер.'),
      card('Ат эндшпилі', 'Ат форпост пен айыр шабуылдарды жақсы көреді.', 'Аттың маршрутын немесе айыр шабуылды тап.'),
      card('Әртүрлі түсті пілдер', 'Бір артық пешка екінші әлсіздіксіз жеңіске жетпеуі мүмкін.', 'Екі қанатта екі әлсіздік жаса.'),
      card('Піл атқа қарсы', 'Піл ашық ойында, ат блокадада күштірек.', 'Орталық пешка алмасуы кімге пайдалы екенін тап.'),
    ]),
    group('Фигура және пешкалар', [
      card('Фигура пешкаларға қарсы', 'Фигура өтпелі пешкаларды тоқтата ала ма - есепте.', 'Король мен фигураның жолын тексер.'),
      card('Артық фигура', 'Алдымен қарсы ойынды және өтпелі пешканы тоқтат.', 'Соңғы қауіпті пешканы қауіпсіз алмастыр.'),
      card('Сапалық артықшылық', 'Ладья атқа немесе пілге қарсы тек белсенділікпен ұтады.', 'Ладья 7-қатарға кіре ала ма, тексер.'),
    ]),
    group('Мат эндшпильдері', [
      card('Ферзімен мат', 'Корольді қатарлармен шектеп, пат жасап қойма.', '10 жүрісте патсыз мат қой.'),
      card('Ладьямен мат', 'Ладьямен корольді кес, өз короліңмен шетке итер.', 'Қарсы корольді тақта шетіне апарып мат қой.'),
      card('Екі піл', 'Пілдер диагональдарды кеседі, король шығу жолдарын жабады.', 'Корольді бұрышқа қуып, диагональдарды ұстап тұр.'),
      card('Піл және ат', 'Ең қиын негізгі мат: корольді піл түсіндегі бұрышқа қу.', 'W үлгісін және дұрыс бұрышты жаттықтыр.'),
    ]),
  ],
};

function group(title: string, cards: EndgameCard[]): EndgameGroup {
  return { title, cards };
}

function card(title: string, text: string, drill: string): EndgameCard {
  return { title, text, drill };
}
