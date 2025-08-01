
import type { Game, Player } from '@/types';
import { Card, CardContent } from './ui/card';
import { XIcon } from './icons/XIcon';
import { OIcon } from './icons/OIcon';
import { cn } from '@/lib/utils';
import { User, Crown } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';
import { PlayerClock } from './PlayerClock';

interface PlayerInfoProps {
  game: Game;
  currentPlayerId: string | null | undefined;
  xTime?: number;
  oTime?: number;
}

export default function PlayerInfo({ game, currentPlayerId, xTime, oTime }: PlayerInfoProps) {
  const { xPlayer, oPlayer, nextTurn, winner, status, timeLimit } = game;
  const isXPlayer = currentPlayerId === xPlayer.uid;
  const isOPlayer = currentPlayerId === oPlayer?.uid;
  
  const PlayerCard = ({ player, symbol, isTurn, isWinner, isYou, time }: { player: Player, symbol: 'X' | 'O', isTurn: boolean, isWinner: boolean, isYou: boolean, time?: number }) => (
    <Card className={cn("transition-all", isTurn && status === 'live' ? 'ring-2 ring-accent shadow-lg' : 'shadow-sm')}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <PlayerAvatar player={player} className="w-10 h-10" />
          <div>
            <p className="font-semibold font-headline">{player.name}</p>
            <p className="text-sm text-muted-foreground">
              Player {symbol}
              {isYou && <span className="text-xs text-primary font-bold"> (You)</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {timeLimit && time !== undefined && (
                <PlayerClock remainingTime={time} isActive={isTurn && status === 'live'} />
            )}
            {isWinner && <Crown className="w-6 h-6 text-yellow-500" />}
        </div>
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
            time={xTime}
        />
        {oPlayer ? (
            <PlayerCard 
                player={oPlayer} 
                symbol="O" 
                isTurn={nextTurn === 'O'} 
                isWinner={winner === 'O'}
                isYou={isOPlayer}
                time={oTime}
            />
        ) : (
            <Card>
                <CardContent className="p-4 flex items-center gap-3 text-muted-foreground">
                    <User className="w-8 h-8" />
                    <div>
                        <p className="font-semibold font-headline">Waiting for Player O...</p>
                    </div>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
