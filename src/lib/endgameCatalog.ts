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

export const endgameCopy: Record<Lang, { title: string; subtitle: string; drill: string }> = {
  ru: {
    title: 'Эндшпиль',
    subtitle: 'Все основные типы окончаний: от пешек до ферзей и матовых схем.',
    drill: 'Тренировка',
  },
  en: {
    title: 'Endgames',
    subtitle: 'All core endgame types: from pawns to queens and mate patterns.',
    drill: 'Drill',
  },
  kk: {
    title: 'Endshpil',
    subtitle: 'Negizgi endshpil turleri: peshkadan ferzige jane mat ulgilerine deiin.',
    drill: 'Jattygu',
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
    group('Peshkaly endshpil', [
      card('Korol jane peshka', 'Kvadrat, oppozitsia jane koroldin buzylyp kirui.', 'Peshkany e5-ke qoyyp, ferzige jol tap.'),
      card('Peshka buzylysy', 'Peshka qurbany otpeli peshka jasaydy.', '2 ge 2 jane 3 ke 3 qurylymdardy kara.'),
      card('Alystagy otpeli', 'Alystagy otpeli qarsy koroldi aldatady.', 'Koroldi aldatyp, ekinshi qanattagy peshkalardy al.'),
    ]),
    group('Ladia jane ferzi', [
      card('Ladialy endshpil', 'Belsendi ladia passiv qorghanystan kushti.', 'Ladia peshka artinda jane janama shahtardy jattyq.'),
      card('Ladia peshkalarga qarsy', 'Peshkalardy artinan nemese janinan toqtat.', 'Shah beru me, peshka alu ma - tauda.'),
      card('Ferzilik endshpil', 'Mangilik shah, korol qauipsizdigi jane otpeli peshkalar.', 'Ashyq korolge mangilik shah tap.'),
      card('Ferzi peshkaga qarsy', 'Shahtarmen koroldi qu, sodan son peshkany al.', '7-qatar peshka pozitsialaryn jattyq.'),
    ]),
    group('Zhenil figuralar', [
      card('Pil endshpili', 'Pil ashyk diagonalda kushti.', 'Pildi otpeli peshka artina qoyyp tekser.'),
      card('At endshpili', 'At forpost pen vilka jaqsyrady.', 'At marshrutyn nemese vilkany tap.'),
      card('Ar turli tusti pilder', 'Bir artyq peshka ekinshi alsizdiksiz jetpeui mumkin.', 'Eki qanatta eki alsizdik jasa.'),
      card('Pil atqa qarsy', 'Pil ashyk oiynda, at blokadada kushti.', 'Ortalyq peshka almasu kimge paidaly ekenin tap.'),
    ]),
    group('Figura jane peshkalar', [
      card('Figura peshkalarga qarsy', 'Figura otpeli peshkalardy toqtata ala ma - esepte.', 'Korol men figura jolyn tekser.'),
      card('Artyq figura', 'Aldymen qarsy oiyndy jane otpeli peshkany toqtat.', 'Songy qauipti peshkany qauipsiz almastyr.'),
      card('Sapalyq artykshylyk', 'Ladia at nemese pilge qarsy tek belsendilikpen utady.', 'Ladia 7-qatargha kira ala ma tekser.'),
    ]),
    group('Mat endshpilderi', [
      card('Ferzimen mat', 'Koroldi qatarlar boiynsha kes jane pat jasama.', '10 juriste patsyz mat qoy.'),
      card('Ladiamen mat', 'Ladiamen koroldi kes, oz korolinmen shetke iter.', 'Qarsy koroldi shetke aparyp mat qoy.'),
      card('Eki pil', 'Pilder diagonaldy kesedi, korol shygu jolyn jabady.', 'Koroldi burysqa quyp, diagonaldy usta.'),
      card('Pil jane at', 'En qiyn negizgi mat: koroldi pil tusindegi burysqa qu.', 'W ulgisin jane durys buryshty jattyq.'),
    ]),
  ],
};

function group(title: string, cards: EndgameCard[]): EndgameGroup {
  return { title, cards };
}

function card(title: string, text: string, drill: string): EndgameCard {
  return { title, text, drill };
}
