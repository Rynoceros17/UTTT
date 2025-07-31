
'use client';

import { XIcon } from './icons/XIcon';
import { OIcon } from './icons/OIcon';
import type { CellState, PlayerSymbol } from '@/types';
import { cn } from '@/lib/utils';

interface CellProps {
  localBoardIndex: number;
  cellIndex: number;
  value: CellState;
  isClickable: boolean;
  playerSymbol: PlayerSymbol;
  isInWinningLine: boolean;
  onCellClick: (localBoardIndex: number, cellIndex: number) => void;
}

export default function Cell({ localBoardIndex, cellIndex, value, isClickable, playerSymbol, isInWinningLine, onCellClick }: CellProps) {
  const handleCellClick = () => {
    if (isClickable) {
      onCellClick(localBoardIndex, cellIndex);
    }
  };

  const cellClasses = cn(
    'relative group flex items-center justify-center aspect-square rounded-sm transition-colors duration-200',
    isClickable ? 'cursor-pointer bg-background hover:bg-primary/10' : 'bg-card',
    isInWinningLine && 'bg-accent/30'
  );

  return (
    <div className={cellClasses} onClick={handleCellClick} role="button" aria-label={`Cell ${cellIndex}`}>
      {value === 'X' && <XIcon className="w-2/3 h-2/3 text-primary animate-in fade-in zoom-in-50" />}
      {value === 'O' && <OIcon className="w-2/3 h-2/3 text-accent animate-in fade-in zoom-in-50" />}
      
      {isClickable && value === null && (
        <>
          {playerSymbol === 'X' && (
            <XIcon className="w-2/3 h-2/3 text-primary opacity-0 group-hover:opacity-40 transition-opacity" />
          )}
          {playerSymbol === 'O' && (
            <OIcon className="w-2/3 h-2/3 text-accent opacity-0 group-hover:opacity-40 transition-opacity" />
          )}
        </>
      )}
    </div>
  );
}
