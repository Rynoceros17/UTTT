'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Game, Player } from '@/types';
import { getGameAction, joinGameAction, makeMoveAction, forfeitGameAction } from '@/actions/gameActions';
import { useToast } from '@/hooks/use-toast';
import GameBoard from './GameBoard';
import PlayerInfo from './PlayerInfo';
import GameStatus from './GameStatus';
import { Button } from './ui/button';
import { ForfeitDialog } from './ForfeitDialog';
import { Card, CardContent } from './ui/card';
import { Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export function GameRoom({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<Game | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isForfeitDialogOpen, setIsForfeitDialogOpen] = useState(false);
  const [forfeitResult, setForfeitResult] = useState<{ summary: string, message: string } | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();

  const playerSymbol = player?.id === game?.xPlayer.id ? 'X' : 'O';
  const isPlayerTurn = game?.nextTurn === playerSymbol && game?.status === 'live';
  const isSpectator = player && game && player.id !== game.xPlayer.id && player.id !== game.oPlayer?.id;

  const fetchGame = useCallback(async () => {
    try {
      const g = await getGameAction(gameId);
      if (g) {
        if (game && game.winner !== g.winner && g.winner) {
          if (g.winner === playerSymbol) {
            confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
          }
        }
        setGame(g);
      } else {
        toast({ title: "Game not found", variant: "destructive" });
        router.push('/');
      }
    } catch (error) {
      console.error("Failed to fetch game:", error);
      toast({ title: "Error fetching game", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [gameId, router, toast, game, playerSymbol]);

  useEffect(() => {
    const storedPlayer = localStorage.getItem('ttt-player');
    if (storedPlayer) {
      setPlayer(JSON.parse(storedPlayer));
    } else {
      router.push('/');
    }
    fetchGame();

    const intervalId = setInterval(fetchGame, 2000);
    return () => clearInterval(intervalId);
  }, [fetchGame, router]);
  
  const handleJoinGame = async () => {
    if (player && game && game.status === 'waiting') {
      await joinGameAction(gameId, player);
    }
  };

  const handleForfeit = async () => {
    if (!player || !game) return;
    try {
      const result = await forfeitGameAction(game.id, player.id);
      setForfeitResult(result);
      setIsForfeitDialogOpen(true);
    } catch (error) {
      toast({ title: "Failed to forfeit", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!game) {
    return <div>Game not found.</div>;
  }

  const isWaitingForYouToJoin = game.status === 'waiting' && player && game.xPlayer.id !== player.id && !game.oPlayer;
  if (isWaitingForYouToJoin) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h2 className="text-2xl font-headline">Waiting for O...</h2>
        <p>{game.xPlayer.name} is waiting for an opponent.</p>
        <Button onClick={handleJoinGame}>Join as Player O</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
      <PlayerInfo game={game} currentPlayerId={player?.id} />
      
      <div className="flex-grow w-full max-w-2xl mx-auto">
        <Card className="shadow-xl">
            <CardContent className="p-2 sm:p-4">
                <GameBoard game={game} playerSymbol={playerSymbol} isPlayerTurn={isPlayerTurn} isSpectator={isSpectator} />
            </CardContent>
        </Card>
        <GameStatus game={game} playerSymbol={playerSymbol} />
      </div>

      <div className="w-full lg:w-64 flex-shrink-0">
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-headline text-lg">Game Info</h3>
            <p><strong>Status:</strong> <span className="capitalize">{game.status}</span></p>
            <p><strong>Game ID:</strong> {game.id}</p>
            {game.status === 'live' && !isSpectator && (
                <Button variant="destructive" className="w-full" onClick={handleForfeit}>Forfeit Game</Button>
            )}
             {game.status === 'finished' && (
              <Button onClick={() => router.push('/')} className="w-full">
                Back to Lobby
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      {forfeitResult && (
        <ForfeitDialog
          isOpen={isForfeitDialogOpen}
          onClose={() => setIsForfeitDialogOpen(false)}
          result={forfeitResult}
        />
      )}
    </div>
  );
}
