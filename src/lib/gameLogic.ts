
import type { Game, Move, CellState, BoardState, PlayerSymbol, Player } from '@/types';

export const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],           // diagonals
];

export function checkWinner(board: (CellState | BoardState)[]): { winner: PlayerSymbol | 'D' | null, winningLine: number[] | null } {
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

export function isBoardFull(board: CellState[]): boolean {
  return board.every(cell => cell !== null);
};

export function createNewGame(gameId: string, player: Player, timeLimit?: number): Game {
  const game: Game = {
    id: gameId,
    playerIds: [player.uid],
    xPlayer: player,
    oPlayer: null,
    status: 'waiting',
    nextTurn: 'X',
    globalBoard: Array(9).fill(null),
    localBoards: Array(81).fill(null),
    activeLocalBoard: null,
    createdAt: Date.now(),
  };

  if (timeLimit) {
    game.timeLimit = timeLimit;
    game.xPlayerTime = timeLimit;
    game.oPlayerTime = timeLimit;
    game.lastMoveTimestamp = Date.now();
  }

  return game;
};

export function applyMove(game: Game, move: Move): Game {
  const newGame: Game = JSON.parse(JSON.stringify(game));
  const { localBoardIndex, cellIndex, player } = move;

  const now = Date.now();
  if (newGame.timeLimit && newGame.lastMoveTimestamp) {
      const timeSpent = (now - newGame.lastMoveTimestamp) / 1000;
      if (player === 'X') {
          newGame.xPlayerTime = (newGame.xPlayerTime || 0) - timeSpent;
      } else {
          newGame.oPlayerTime = (newGame.oPlayerTime || 0) - timeSpent;
      }
  }
  newGame.lastMoveTimestamp = now;

  const flatIndex = localBoardIndex * 9 + cellIndex;
  newGame.localBoards[flatIndex] = player;
  newGame.lastMove = move;
  
  const localBoardStartIndex = localBoardIndex * 9;
  const localBoard = newGame.localBoards.slice(localBoardStartIndex, localBoardStartIndex + 9);

  const localWinnerCheck = checkWinner(localBoard);
  if (localWinnerCheck.winner) {
    newGame.globalBoard[localBoardIndex] = localWinnerCheck.winner;
    
    const globalWinnerCheck = checkWinner(newGame.globalBoard);
    if (globalWinnerCheck.winner) {
      newGame.winner = globalWinnerCheck.winner;
      newGame.winningLine = globalWinnerCheck.winningLine || undefined;
      newGame.status = 'finished';
      newGame.winReason = 'checkmate';
      newGame.activeLocalBoard = null;
      return newGame;
    }
  }

  const nextBoardIsWon = newGame.globalBoard[cellIndex] !== null;
  newGame.activeLocalBoard = nextBoardIsWon ? null : cellIndex;
  newGame.nextTurn = player === 'X' ? 'O' : 'X';

  if (newGame.globalBoard.every(b => b !== null)) {
    newGame.winner = 'D';
    newGame.status = 'finished';
  }

  return newGame;
};
