
import type { Game, PlayerSymbol } from '@/types';
import { Trophy, Hourglass, CheckCircle } from 'lucide-react';

interface GameStatusProps {
  game: Game;
  playerSymbol: PlayerSymbol;
}

export default function GameStatus({ game, playerSymbol }: GameStatusProps) {
  const { status, winner, nextTurn, xPlayer, oPlayer } = game;
  const isMyTurn = playerSymbol === nextTurn;
  const nextPlayerName = nextTurn === 'X' ? xPlayer.name : oPlayer?.name;

  let content;

  if (status === 'finished') {
    let message = "Game Over!";
    if (winner === 'D') {
      message = "It's a draw!";
    } else if (winner === playerSymbol) {
      message = "You won!";
    } else {
      message = "You lost.";
    }
    content = (
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <p>{message}</p>
      </div>
    );
  } else if (status === 'live') {
    content = (
       <div className="flex items-center gap-2">
        {isMyTurn ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Hourglass className="w-5 h-5 text-orange-500 animate-spin" />}
        <p>{isMyTurn ? "Your turn!" : `Waiting for ${nextPlayerName}...`}</p>
      </div>
    );
  } else {
     content = (
       <div className="flex items-center gap-2">
         <Hourglass className="w-5 h-5 text-gray-500" />
        <p>Waiting for opponent to join...</p>
      </div>
     );
  }

  return (
    <div className="mt-4 text-center">
        <div className="inline-flex items-center justify-center p-2 px-4 rounded-full bg-card shadow-md font-semibold text-foreground">
            {content}
        </div>
    </div>
  );
}
