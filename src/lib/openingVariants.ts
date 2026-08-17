import type { PlayerColor } from './types';

export type OpeningMove = {
  san: string;
  side: PlayerColor;
};

export type OpeningVariant = {
  id: string;
  opening: string;
  variant: string;
  startFen: string;
  userSide: PlayerColor;
  moves: OpeningMove[];
};

const START_FEN = 'start';

export const openingVariants: OpeningVariant[] = [
  {
    id: 'sicilian-najdorf',
    opening: 'Sicilian Defense',
    variant: 'Najdorf Variation',
    startFen: START_FEN,
    userSide: 'white',
    moves: [
      { side: 'white', san: 'e4' },
      { side: 'black', san: 'c5' },
      { side: 'white', san: 'Nf3' },
      { side: 'black', san: 'd6' },
      { side: 'white', san: 'd4' },
      { side: 'black', san: 'cxd4' },
      { side: 'white', san: 'Nxd4' },
      { side: 'black', san: 'Nf6' },
      { side: 'white', san: 'Nc3' },
      { side: 'black', san: 'a6' },
      { side: 'white', san: 'Bg5' },
    ],
  },
  {
    id: 'ruy-lopez-berlin',
    opening: 'Ruy Lopez',
    variant: 'Berlin Defense',
    startFen: START_FEN,
    userSide: 'white',
    moves: [
      { side: 'white', san: 'e4' },
      { side: 'black', san: 'e5' },
      { side: 'white', san: 'Nf3' },
      { side: 'black', san: 'Nc6' },
      { side: 'white', san: 'Bb5' },
      { side: 'black', san: 'Nf6' },
      { side: 'white', san: 'O-O' },
      { side: 'black', san: 'Nxe4' },
      { side: 'white', san: 'd4' },
    ],
  },
  {
    id: 'queens-gambit-accepted',
    opening: "Queen's Gambit",
    variant: 'Accepted Variation',
    startFen: START_FEN,
    userSide: 'white',
    moves: [
      { side: 'white', san: 'd4' },
      { side: 'black', san: 'd5' },
      { side: 'white', san: 'c4' },
      { side: 'black', san: 'dxc4' },
      { side: 'white', san: 'e3' },
      { side: 'black', san: 'Nf6' },
      { side: 'white', san: 'Bxc4' },
      { side: 'black', san: 'e6' },
      { side: 'white', san: 'Nf3' },
    ],
  },
];

export function variantForOpening(opening: string) {
  const lower = opening.toLowerCase();
  if (lower.includes('sicilian')) return openingVariants[0];
  if (lower.includes('ruy') || lower.includes('spanish') || lower.includes('испан')) return openingVariants[1];
  if (lower.includes('queen') || lower.includes('gambit') || lower.includes('ферз')) return openingVariants[2];
  return openingVariants[Math.abs(hashText(opening)) % openingVariants.length];
}

function hashText(value: string) {
  return [...value].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}
