import type { Game, Move, CellState, BoardState, PlayerSymbol } from '@/types';

export const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],           // diagonals
];

export const checkWinner = (board: (CellState | BoardState)[]): { winner: PlayerSymbol | 'D' | null, winningLine: number[] | null } => {
  for (const line of WINNING_COMBINATIONS) {
    const [a, b, c] = line;
    if (board[a] && board[a] !== 'D' && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as PlayerSymbol, winningLine: line };
    }
  }

  if (board.every(cell => cell !== null)) {
    return { winner: 'D', winningLine: null };
  }

  return { winner: null, winningLine: null };
};

export const isBoardFull = (board: CellState[]): boolean => {
  return board.every(cell => cell !== null);
};

export const createNewGame = (gameId: string, player: Player): Game => {
  return {
    id: gameId,
    xPlayer: player,
    oPlayer: null,
    status: 'waiting',
    nextTurn: 'X',
    globalBoard: Array(9).fill(null),
    localBoards: Array(9).fill(null).map(() => Array(9).fill(null)),
    activeLocalBoard: null,
    createdAt: Date.now(),
  };
};

export const applyMove = (game: Game, move: Move): Game => {
  const newGame = JSON.parse(JSON.stringify(game)); // Deep copy
  const { localBoardIndex, cellIndex, playerSymbol } = move;

  newGame.localBoards[localBoardIndex][cellIndex] = playerSymbol;
  newGame.lastMove = move;

  // Check for local board winner
  const localWinnerCheck = checkWinner(newGame.localBoards[localBoardIndex]);
  if (localWinnerCheck.winner) {
    newGame.globalBoard[localBoardIndex] = localWinnerCheck.winner;
    // Check for global winner
    const globalWinnerCheck = checkWinner(newGame.globalBoard);
    if (globalWinnerCheck.winner) {
      newGame.winner = globalWinnerCheck.winner;
      newGame.winningLine = globalWinnerCheck.winningLine || undefined;
      newGame.status = 'finished';
      newGame.activeLocalBoard = null;
      return newGame;
    }
  }

  // Determine next active board
  const nextLocalBoardIsWonOrFull = 
    newGame.globalBoard[cellIndex] !== null || 
    isBoardFull(newGame.localBoards[cellIndex]);
    
  newGame.activeLocalBoard = nextLocalBoardIsWonOrFull ? null : cellIndex;
  newGame.nextTurn = playerSymbol === 'X' ? 'O' : 'X';

  // Check for global draw
  if (newGame.globalBoard.every(b => b !== null)) {
    newGame.winner = 'D';
    newGame.status = 'finished';
  }

  return newGame;
};
