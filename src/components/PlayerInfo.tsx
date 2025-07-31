import type { Game } from '@/types';
import { Card, CardContent } from './ui/card';
import { XIcon } from './icons/XIcon';
import { OIcon } from './icons/OIcon';
import { cn } from '@/lib/utils';
import { User, Crown } from 'lucide-react';

interface PlayerInfoProps {
  game: Game;
  currentPlayerId: string | null | undefined;
}

export default function PlayerInfo({ game, currentPlayerId }: PlayerInfoProps) {
  const { xPlayer, oPlayer, nextTurn, winner, status } = game;
  const isXPlayer = currentPlayerId === xPlayer.id;
  const isOPlayer = currentPlayerId === oPlayer?.id;
  
  const PlayerCard = ({ player, symbol, isTurn, isWinner, isYou }: { player: {name: string}, symbol: 'X' | 'O', isTurn: boolean, isWinner: boolean, isYou: boolean }) => (
    <Card className={cn("transition-all", isTurn && status === 'live' ? 'ring-2 ring-accent shadow-lg' : 'shadow-sm')}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {symbol === 'X' ? <XIcon className="w-8 h-8 text-primary" /> : <OIcon className="w-8 h-8 text-accent" />}
          <div>
            <p className="font-semibold font-headline">{player.name}</p>
            <p className="text-sm text-muted-foreground">
              Player {symbol}
              {isYou && <span className="text-xs text-primary font-bold"> (You)</span>}
            </p>
          </div>
        </div>
        {isWinner && <Crown className="w-6 h-6 text-yellow-500" />}
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
        <PlayerCard 
            player={xPlayer} 
            symbol="X" 
            isTurn={nextTurn === 'X'} 
            isWinner={winner === 'X'}
            isYou={isXPlayer}
        />
        {oPlayer ? (
            <PlayerCard 
                player={oPlayer} 
                symbol="O" 
                isTurn={nextTurn === 'O'} 
                isWinner={winner === 'O'}
                isYou={isOPlayer}
            />
        ) : (
            <Card>
                <CardContent className="p-4 flex items-center gap-3 text-muted-foreground">
                    <User className="w-8 h-8" />
                    <div>
                        <p className="font-semibold font-headline">Waiting for Player O</p>
                    </div>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
