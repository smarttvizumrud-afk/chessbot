import type { PlayerColor } from './types';

export type OpeningMove = { san: string; side: PlayerColor };
export type OpeningVariant = {
  id: string;
  opening: string;
  variant: string;
  startFen: string;
  userSide: PlayerColor;
  ideas: string;
  aliases: string[];
  moves: OpeningMove[];
};

const START_FEN = 'start';

export const openingVariants: OpeningVariant[] = [
  line('sicilian-najdorf', 'Sicilian Defense', 'Najdorf Variation', 'white', 'Learn the main Sicilian structure: pressure on d5, quick development, and attacks on opposite wings.', ['sicilian', 'najdorf'], ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Bg5']),
  line('sicilian-dragon', 'Sicilian Defense', 'Dragon Yugoslav Attack', 'white', 'White castles long and attacks the king; Black counters on the c-file and long diagonal.', ['sicilian', 'dragon', 'yugoslav'], ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6', 'Be3', 'Bg7', 'f3', 'O-O', 'Qd2']),
  line('smith-morra', 'Sicilian Defense', 'Smith-Morra Gambit', 'white', 'Sacrifice a pawn for fast development, open files, and pressure on c3-d5.', ['sicilian', 'smith', 'morra'], ['e4', 'c5', 'd4', 'cxd4', 'c3', 'dxc3', 'Nxc3', 'Nc6', 'Nf3', 'd6', 'Bc4']),
  line('ruy-berlin', 'Ruy Lopez', 'Berlin Defense', 'white', 'The Berlin tests central memory early; White must know when to open the center.', ['ruy', 'lopez', 'spanish', 'berlin', 'испан'], ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6', 'O-O', 'Nxe4', 'd4']),
  line('italian-fried-liver', 'Italian Game', 'Fried Liver Attack', 'white', 'A forcing attacking line against Two Knights: aim at f7 and calculate checks.', ['italian', 'two knights', 'fried liver'], ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Nxd5', 'Nxf7', 'Kxf7', 'Qf3+', 'Ke6', 'Nc3']),
  line('italian-evans', 'Italian Game', 'Evans Gambit', 'white', 'Give the b-pawn to build a fast center and attack before Black consolidates.', ['italian', 'evans'], ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4', 'Bxb4', 'c3', 'Ba5', 'd4']),
  line('legal-trap', 'Italian Game', 'Legal Trap', 'white', 'A classic trap: ignore the pinned knight only when tactics on f7 and d5 work.', ['legal', 'trap', 'italian'], ['e4', 'e5', 'Nf3', 'd6', 'Bc4', 'Bg4', 'Nc3', 'g6', 'Nxe5', 'Bxd1', 'Bxf7+', 'Ke7', 'Nd5#']),
  line('blackburne-shilling', 'Italian Game', 'Blackburne Shilling Trap', 'black', 'Black tempts White into grabbing e5, then attacks with queen and knight threats.', ['blackburne', 'shilling', 'trap'], ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nd4', 'Nxe5', 'Qg5']),
  line('scotch-main', 'Scotch Game', 'Main Line', 'white', 'Open the center early and learn the active piece placement after d4.', ['scotch'], ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4', 'Nf6', 'Nc3', 'Bb4']),
  line('vienna-gambit', 'Vienna Game', 'Vienna Gambit', 'white', 'Use Nc3 and f4 to fight for the center while keeping tactical threats on e5.', ['vienna'], ['e4', 'e5', 'Nc3', 'Nf6', 'f4', 'd5', 'fxe5', 'Nxe4']),
  line('kings-gambit', "King's Gambit", 'Accepted Main Trap Ideas', 'white', 'White gambits the f-pawn to open lines; know the king safety risks.', ['king gambit', "king's gambit"], ['e4', 'e5', 'f4', 'exf4', 'Nf3', 'g5', 'h4', 'g4', 'Ne5']),
  line('french-winawer', 'French Defense', 'Winawer Variation', 'black', 'Black attacks the center with ...Bb4 and ...c5; learn the pawn-chain counterplay.', ['french', 'winawer'], ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4', 'e5', 'c5', 'a3', 'Bxc3+', 'bxc3', 'Ne7']),
  line('french-advance', 'French Defense', 'Advance Variation', 'black', 'Attack the d4 pawn chain with ...c5, ...Nc6, and queen pressure.', ['french', 'advance'], ['e4', 'e6', 'd4', 'd5', 'e5', 'c5', 'c3', 'Nc6', 'Nf3', 'Qb6', 'Bd3']),
  line('caro-advance', 'Caro-Kann Defense', 'Advance Variation', 'black', 'A solid structure where Black develops the bishop before locking with ...e6.', ['caro', 'kann', 'advance'], ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'Nf3', 'e6', 'Be2', 'c5']),
  line('caro-fantasy', 'Caro-Kann Defense', 'Fantasy Variation', 'black', 'White grabs space with f3; Black must strike the center before falling behind.', ['caro', 'fantasy'], ['e4', 'c6', 'd4', 'd5', 'f3', 'dxe4', 'fxe4', 'e5', 'Nf3']),
  line('scandinavian-main', 'Scandinavian Defense', 'Main Line', 'black', 'Learn the queen retreat and development plan after White attacks the queen.', ['scandinavian', 'center counter'], ['e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qa5', 'd4', 'Nf6', 'Nf3']),
  line('pirc-austrian', 'Pirc Defense', 'Austrian Attack', 'black', 'Black allows a big white center, then attacks it with pieces and pawn breaks.', ['pirc', 'austrian'], ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6', 'f4', 'Bg7', 'Nf3', 'O-O']),
  line('alekhine-four-pawns', 'Alekhine Defense', 'Four Pawns Attack', 'black', 'Black provokes pawns forward and later attacks the overextended center.', ['alekhine'], ['e4', 'Nf6', 'e5', 'Nd5', 'd4', 'd6', 'c4', 'Nb6', 'f4']),
  line('queens-gambit-accepted', "Queen's Gambit", 'Accepted Variation', 'white', 'Regain the c4 pawn calmly and build a healthy central structure.', ['queen', 'gambit', 'accepted', 'ферз'], ['d4', 'd5', 'c4', 'dxc4', 'e3', 'Nf6', 'Bxc4', 'e6', 'Nf3']),
  line('queens-gambit-declined', "Queen's Gambit", 'Declined Orthodox', 'white', 'A classical center fight: develop, pin the knight, and prepare e3/Nf3.', ['queen', 'gambit', 'declined', 'qgd'], ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O']),
  line('slav-main', 'Slav Defense', 'Main Line', 'white', 'Black supports d5 with c6; White learns how to recover c4 and keep pressure.', ['slav'], ['d4', 'd5', 'c4', 'c6', 'Nf3', 'Nf6', 'Nc3', 'dxc4', 'a4']),
  line('semi-slav', 'Semi-Slav Defense', 'Meran Setup', 'white', 'A sharp Queen’s Gambit family line with central tension and tactical breaks.', ['semi-slav', 'meran'], ['d4', 'd5', 'c4', 'c6', 'Nf3', 'Nf6', 'Nc3', 'e6', 'Bg5']),
  line('london-system', 'London System', 'Main Setup', 'white', 'A reliable setup: Bf4, e3, Nf3, Bd3, and a safe king.', ['london'], ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3', 'Bd6']),
  line('trompowsky', 'Trompowsky Attack', 'Main Trap Ideas', 'white', 'White immediately pins or challenges the f6 knight and creates unusual tactics.', ['trompowsky'], ['d4', 'Nf6', 'Bg5', 'Ne4', 'Bf4', 'c5', 'f3', 'Qa5+']),
  line('kings-indian', "King's Indian Defense", 'Classical Setup', 'black', 'Black lets White build the center, then attacks with ...e5 or ...c5 breaks.', ['king indian', "king's indian"], ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O']),
  line('benko-gambit', 'Benko Gambit', 'Accepted Structure', 'black', 'Sacrifice the b-pawn for long-term pressure on the a- and b-files.', ['benko', 'volga'], ['d4', 'Nf6', 'c4', 'c5', 'd5', 'b5', 'cxb5', 'a6']),
  line('nimzo-indian', 'Nimzo-Indian Defense', 'Classical Variation', 'black', 'Black pins the c3 knight and fights for dark-square control.', ['nimzo', 'nimzo-indian'], ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'e3', 'O-O', 'Bd3', 'd5']),
  line('catalan', 'Catalan Opening', 'Open Catalan Setup', 'white', 'Fianchetto the bishop and pressure the queenside while keeping a strong center.', ['catalan'], ['d4', 'Nf6', 'c4', 'e6', 'g3', 'd5', 'Bg2', 'Be7', 'Nf3', 'O-O']),
  line('english-four-knights', 'English Opening', 'Four Knights', 'white', 'Start with c4 and fight for d5 using flexible development.', ['english'], ['c4', 'e5', 'Nc3', 'Nf6', 'g3', 'd5', 'cxd5', 'Nxd5']),
  line('reti-opening', 'Reti Opening', 'King Fianchetto', 'white', 'Control the center from a distance and transpose into many queen-pawn systems.', ['reti', 'réti'], ['Nf3', 'd5', 'c4', 'e6', 'g3', 'Nf6', 'Bg2', 'Be7']),
  line('dutch-defense', 'Dutch Defense', 'Leningrad Setup', 'black', 'Black plays ...f5 for kingside space and active counterplay.', ['dutch', 'leningrad'], ['d4', 'f5', 'c4', 'Nf6', 'g3', 'e6', 'Bg2', 'Be7']),
  line('budapest-gambit', 'Budapest Gambit', 'Main Trap Ideas', 'black', 'Black sacrifices a pawn to activate pieces quickly and attack e5.', ['budapest'], ['d4', 'Nf6', 'c4', 'e5', 'dxe5', 'Ng4', 'Nf3', 'Nc6']),
  line('stafford-gambit', 'Petrov Defense', 'Stafford Gambit', 'black', 'A trap-heavy gambit: Black gives a pawn for fast development and attacking chances.', ['stafford', 'petrov'], ['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'Nc6']),
];

export function variantForOpening(opening: string) {
  const lower = opening.toLowerCase();
  const matched = openingVariants
    .map((variant) => ({ variant, score: matchScore(lower, variant) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.variant;
  return matched ?? openingVariants[Math.abs(hashText(opening)) % openingVariants.length];
}

export function variantById(id: string) {
  return openingVariants.find((variant) => variant.id === id) ?? openingVariants[0];
}

function line(
  id: string,
  opening: string,
  variant: string,
  userSide: PlayerColor,
  ideas: string,
  aliases: string[],
  moves: string[],
): OpeningVariant {
  return {
    id,
    opening,
    variant,
    startFen: START_FEN,
    userSide,
    ideas,
    aliases,
    moves: moves.map((san, index) => ({ san, side: index % 2 === 0 ? 'white' : 'black' })),
  };
}

function matchScore(search: string, variant: OpeningVariant) {
  const values = [variant.opening, variant.variant, ...variant.aliases].map((value) => value.toLowerCase());
  return values.reduce((score, value) => score + (search.includes(value) || value.includes(search) ? value.length : 0), 0);
}

function hashText(value: string) {
  return [...value].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}
