
import type { User } from 'firebase/auth';

export type PlayerSymbol = 'X' | 'O';
export type CellState = PlayerSymbol | null;
export type BoardState = PlayerSymbol | 'D' | null;

export type Player = {
  uid: string;
  name: string;
  icon: string;
  color: string;
  wins: number;
  losses: number;
};

export type Move = {
  gameId: string;
  player: PlayerSymbol;
  localBoardIndex: number;
  cellIndex: number;
};

export type ChatMessage = {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
};

export type Game = {
  id:string;
  createdAt: number;
  playerIds: string[]; // For querying games by player
  xPlayer: Player;
  oPlayer: Player | null;
  status: 'waiting' | 'live' | 'finished';
  nextTurn: PlayerSymbol;
  globalBoard: BoardState[];
  localBoards: CellState[]; // Changed from CellState[][] to CellState[]
  lastMove?: Move;
  winner?: PlayerSymbol | 'D';
  winningLine?: number[];
  activeLocalBoard: number | null;
  chat?: ChatMessage[];
  rematchRequestedBy?: string[];
  nextGameId?: string;
  
  // Clock fields
  timeLimit?: number; // in seconds
  xPlayerTime?: number; // remaining time in seconds
  oPlayerTime?: number; // remaining time in seconds
  lastMoveTimestamp?: number;
  winReason?: 'timeout' | 'checkmate';
};

export interface AuthContextType {
  user: User | null;
  player: Player | null;
  loading: boolean;
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
}
