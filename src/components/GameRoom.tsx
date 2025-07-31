
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Game } from '@/types';
import { joinGameAction, forfeitGameAction } from '@/actions/gameActions';
import { useToast } from '@/hooks/use-toast';
import GameBoard from './GameBoard';
import PlayerInfo from './PlayerInfo';
import GameStatus from './GameStatus';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

export function GameRoom({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<Game | null>(null);
  const { player, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  const { toast } = useToast();

  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
      if (game && game.status === 'live' && player) {
        const isPlayerInGame = game.playerIds.includes(player.uid);
        if (isPlayerInGame) {
          forfeitGameAction(game.id, player.uid);
        }
      }
  }, [game, player]);

  useEffect(() => {
    if (authLoading) return;
    if (!player) {
      router.push('/');
      return;
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    const gameDocRef = doc(db, 'games', gameId);
    
    const unsubscribe = onSnapshot(gameDocRef, (doc) => {
        if (doc.exists()) {
            const newGame = doc.data() as Game;
            setGame((prevGame) => {
                if (prevGame && prevGame.winner !== newGame.winner && newGame.winner) {
                    const currentPlayerIsX = player?.uid === newGame.xPlayer.uid;
                    const playerSymbol = currentPlayerIsX ? 'X' : 'O';
                    if (newGame.winner === playerSymbol) {
                        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
                    }
                }
                return newGame;
            });
        } else {
            toast({ title: "Game not found", variant: "destructive" });
            router.push('/');
        }
        setIsLoading(false);
    }, (error) => {
        console.error("Failed to subscribe to game updates:", error);
        toast({ title: "Error fetching game", variant: "destructive" });
        setIsLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [authLoading, player, gameId, router, toast, handleBeforeUnload]);
  
  const handleJoinGame = async () => {
    if (player && game && game.status === 'waiting') {
      await joinGameAction(game.id, player);
    }
  };

  const handleForfeit = async () => {
    if (!player || !game) return;
    await forfeitGameAction(game.id, player.uid);
  };

  if (isLoading || authLoading || !player) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!game) {
    return <div>Game not found. Going back to lobby...</div>;
  }
  
  const isPlayerX = player.uid === game.xPlayer.uid;
  const playerSymbol = isPlayerX ? 'X' : 'O';
  const isPlayerTurn = game.nextTurn === playerSymbol && game.status === 'live';
  const isSpectator = player.uid !== game.xPlayer.uid && player.uid !== game.oPlayer?.uid;
  const currentPlayerInGame = playerSymbol === 'X' ? game.xPlayer : game.oPlayer;

  if (game.status === 'waiting') {
    if (isPlayerX) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
          <h2 className="text-2xl font-headline">Waiting for an opponent to join...</h2>
          <p className="text-muted-foreground">Share the game ID or have them find it in the lobby.</p>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    } else {
      // This is for the player who is joining
       return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <h2 className="text-2xl font-headline">{game.xPlayer.name} is waiting for an opponent.</h2>
          <Button onClick={handleJoinGame}>Join as Player O</Button>
        </div>
      );
    }
  }


  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
      <PlayerInfo game={game} currentPlayerId={player?.uid} />
      
      <div className="flex-grow w-full max-w-2xl mx-auto">
        <Card className="shadow-xl">
            <CardContent className="p-2 sm:p-4">
                <GameBoard 
                    game={game} 
                    playerSymbol={playerSymbol} 
                    isPlayerTurn={isPlayerTurn} 
                    isSpectator={isSpectator}
                    currentPlayer={currentPlayerInGame}
                />
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
    </div>
  );
}
