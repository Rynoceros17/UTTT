
'use client';

import { XIcon } from './icons/XIcon';
import { OIcon } from './icons/OIcon';
import { makeMoveAction } from '@/actions/gameActions';
import type { CellState, PlayerSymbol, Player } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CellProps {
  localBoardIndex: number;
  cellIndex: number;
  value: CellState;
  isClickable: boolean;
  playerSymbol: PlayerSymbol;
  gameId: string;
  isInWinningLine: boolean;
  currentPlayer: Player | null;
}

export default function Cell({ localBoardIndex, cellIndex, value, isClickable, playerSymbol, gameId, isInWinningLine, currentPlayer }: CellProps) {
  const { toast } = useToast();

  const handleCellClick = async () => {
    if (!isClickable || !currentPlayer) return;

    try {
      const result = await makeMoveAction(gameId, { gameId, player: playerSymbol, localBoardIndex, cellIndex });
      if (!result.success) {
        toast({
          title: "Invalid Move",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error making move:", error);
      toast({
        title: "Error",
        description: "Could not make move.",
        variant: "destructive",
      });
    }
  };

  const cellClasses = cn(
    'relative flex items-center justify-center aspect-square rounded-sm transition-colors duration-200',
    isClickable ? 'cursor-pointer bg-background hover:bg-primary/20' : 'bg-card',
    value === null && isClickable && 'after:content-[""] after:absolute after:inset-0 after:rounded-sm after:bg-accent after:opacity-0 hover:after:opacity-100 after:transition-opacity',
    isInWinningLine && 'bg-accent/30'
  );

  return (
    <div className={cellClasses} onClick={handleCellClick} role="button" aria-label={`Cell ${cellIndex}`}>
      {value === 'X' && <XIcon className="w-2/3 h-2/3 text-primary animate-in fade-in zoom-in-50" />}
      {value === 'O' && <OIcon className="w-2/3 h-2/3 text-accent animate-in fade-in zoom-in-50" />}
    </div>
  );
}
