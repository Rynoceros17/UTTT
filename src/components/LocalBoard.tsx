'use client';

import Cell from './Cell';
import { XIcon } from './icons/XIcon';
import { OIcon } from './icons/OIcon';
import type { CellState, PlayerSymbol, BoardState } from '@/types';
import { cn } from '@/lib/utils';
import { checkWinner } from '@/lib/gameLogic';

interface LocalBoardProps {
  localBoardIndex: number;
  cells: CellState[];
  winner: BoardState;
  isActive: boolean;
  isClickable: boolean;
  playerSymbol: PlayerSymbol;
  gameId: string;
}

export default function LocalBoard({ localBoardIndex, cells, winner, isActive, isClickable, playerSymbol, gameId }: LocalBoardProps) {
  const localWinnerCheck = checkWinner(cells);
  const localWinningLine = localWinnerCheck.winner && localWinnerCheck.winner !== 'D' ? localWinnerCheck.winningLine : null;
  
  const boardClasses = cn(
    'relative grid grid-cols-3 grid-rows-3 gap-1 rounded-md transition-all duration-300',
    winner ? 'bg-background' : 'bg-card',
    isActive && isClickable && !winner ? 'bg-primary/10 shadow-lg ring-2 ring-primary' : 'shadow-sm',
    winner === 'X' && 'bg-blue-200/50',
    winner === 'O' && 'bg-orange-200/50',
    winner === 'D' && 'bg-muted/80',
  );

  return (
    <div className={boardClasses}>
      {cells.map((cell, i) => (
        <Cell
          key={i}
          localBoardIndex={localBoardIndex}
          cellIndex={i}
          value={cell}
          isClickable={isClickable && isActive && !winner && cell === null}
          playerSymbol={playerSymbol}
          gameId={gameId}
          isInWinningLine={localWinningLine?.includes(i) ?? false}
        />
      ))}
      {winner && winner !== 'D' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {winner === 'X' && <XIcon className="w-3/4 h-3/4 text-primary/70" />}
          {winner === 'O' && <OIcon className="w-3/4 h-3/4 text-accent/70" />}
        </div>
      )}
    </div>
  );
}
