
'use client';

import LocalBoard from './LocalBoard';
import type { Game, PlayerSymbol, Player } from '@/types';
import { WINNING_COMBINATIONS } from '@/lib/gameLogic';
import { cn } from '@/lib/utils';

interface GameBoardProps {
  game: Game;
  playerSymbol: PlayerSymbol;
  isPlayerTurn: boolean;
  isSpectator: boolean;
  onMakeMove: (localBoardIndex: number, cellIndex: number) => void;
}

export default function GameBoard({ game, playerSymbol, isPlayerTurn, isSpectator, onMakeMove }: GameBoardProps) {
  const { localBoards, globalBoard, activeLocalBoard, winner, winningLine, status } = game;
  const globalWinningLine = winner && winner !== 'D' ? winningLine : null;

  let endMessage = "";
  if (status === 'finished') {
    if (winner === 'D') {
      endMessage = "It's a Draw!";
    } else if (winner === playerSymbol && !isSpectator) {
      endMessage = "You Won!";
    } else if (isSpectator) {
      endMessage = `Player ${winner} Won!`;
    } else {
      endMessage = "You Lost.";
    }
  }

  return (
    <div className="relative aspect-square">
      <div className="grid grid-cols-3 grid-rows-3 gap-1 md:gap-2 bg-muted/60 p-1 md:p-2 rounded-lg shadow-inner w-full h-full">
        {Array.from({ length: 9 }).map((_, i) => {
          const localBoardCells = localBoards.slice(i * 9, i * 9 + 9);
          return (
            <LocalBoard
              key={i}
              localBoardIndex={i}
              cells={localBoardCells}
              winner={globalBoard[i]}
              isActive={activeLocalBoard === i || (activeLocalBoard === null && globalBoard[i] === null)}
              isClickable={isPlayerTurn && !isSpectator}
              playerSymbol={playerSymbol}
              onCellClick={onMakeMove}
            />
          );
        })}
      </div>
      {globalWinningLine && (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
            <line 
                x1={((globalWinningLine[0] % 3) * 33.33) + 16.67} 
                y1={(Math.floor(globalWinningLine[0] / 3) * 33.33) + 16.67}
                x2={((globalWinningLine[2] % 3) * 33.33) + 16.67} 
                y2={(Math.floor(globalWinningLine[2] / 3) * 33.33) + 16.67}
                className="stroke-accent"
                strokeWidth="2" 
                strokeLinecap="round"
             />
        </svg>
      )}
      {status === 'finished' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 animate-in fade-in-50 rounded-lg">
            <h2 className="text-4xl md:text-6xl font-bold font-headline text-white animate-in zoom-in-75 slide-in-from-bottom-5">
                {endMessage}
            </h2>
        </div>
      )}
    </div>
  );
}
