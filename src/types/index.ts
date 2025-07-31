
export type PlayerSymbol = 'X' | 'O';
export type CellState = PlayerSymbol | null;
export type BoardState = PlayerSymbol | 'D' | null;

export type Player = {
  id: string;
  name: string;
};

export type Move = {
  gameId: string;
  player: PlayerSymbol;
  localBoardIndex: number;
  cellIndex: number;
};

export type Game = {
  id: string;
  createdAt: number;
  playerIds: string[]; // For querying games by player
  xPlayer: Player;
  oPlayer: Player | null;
  status: 'waiting' | 'live' | 'finished';
  nextTurn: PlayerSymbol;
  globalBoard: BoardState[];
  localBoards: CellState[][];
  lastMove?: Move;
  winner?: PlayerSymbol | 'D';
  winningLine?: number[];
  activeLocalBoard: number | null;
};
