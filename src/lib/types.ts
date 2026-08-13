export type Platform = 'chesscom' | 'lichess';
export type Lang = 'ru' | 'en' | 'kk';
export type AppTheme = 'dark' | 'green' | 'light';
export type PieceStyle = 'classic' | 'alpha' | 'neo';
export type GameResult = 'win' | 'loss' | 'draw';
export type PlayerColor = 'white' | 'black';

export type ImportedGame = {
  platform: Platform;
  platformGameId: string;
  username: string;
  opponent: string;
  playedAt: string;
  result: GameResult;
  color: PlayerColor;
  playerRating?: number;
  opening: string;
  pgn: string;
  timeControl: string;
};

export type PlayerRatings = {
  platform: Platform;
  username: string;
  classical?: number;
  rapid?: number;
  blitz?: number;
};

export type MoveReport = {
  ply: number;
  moveNumber: number;
  san: string;
  side: 'player' | 'opponent';
  fenBefore: string;
  playedEval: number;
  bestMove: string;
  bestEval: number;
  loss: number;
  label: 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  phase: 'opening' | 'middlegame' | 'endgame';
  theme: string;
  explanation: string;
};

export type GameAnalysis = {
  accuracy: number;
  inaccuracies: number;
  mistakes: number;
  blunders: number;
  weakSpots: string[];
  trainingPlan: string[];
  moveReports: MoveReport[];
  aiSummary: string;
};

export type StoredGame = ImportedGame & { id: string };
export type StoredProfile = PlayerRatings & { id: string; connectedAt: string };
export type StoredAnalysis = GameAnalysis & { id: string; gameId: string; createdAt: string };
