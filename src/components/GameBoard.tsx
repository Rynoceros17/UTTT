'use client';

import LocalBoard from './LocalBoard';
import type { Game, PlayerSymbol } from '@/types';
import { cn } from '@/lib/utils';
import { WINNING_COMBINATIONS } from '@/lib/gameLogic';
import { useState } from 'react';

interface GameBoardProps {
  game: Game;
  playerSymbol: PlayerSymbol;
  isPlayerTurn: boolean;
  isSpectator: boolean;
}

export default function GameBoard({ game, playerSymbol, isPlayerTurn, isSpectator }: GameBoardProps) {
  const { localBoards, globalBoard, activeLocalBoard, winner, winningLine } = game;
  const [hoveredLine, setHoveredLine] = useState<number[] | null>(null);

  const globalWinningLine = winner && winner !== 'D' ? winningLine : null;

  return (
    <div className="relative aspect-square">
      <div className="grid grid-cols-3 grid-rows-3 gap-1 md:gap-2 bg-muted/60 p-1 md:p-2 rounded-lg shadow-inner w-full h-full">
        {localBoards.map((cells, i) => (
          <LocalBoard
            key={i}
            localBoardIndex={i}
            cells={cells}
            winner={globalBoard[i]}
            isActive={activeLocalBoard === i || (activeLocalBoard === null && globalBoard[i] === null)}
            isClickable={isPlayerTurn && !isSpectator}
            playerSymbol={playerSymbol}
            gameId={game.id}
          />
        ))}
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
    </div>
  );
}
