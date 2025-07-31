
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Game, PlayerSymbol } from '@/types';
import { joinGameAction, forfeitGameAction, makeMoveAction } from '@/actions/gameActions';
import { applyMove } from '@/lib/gameLogic';
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
  const [isJoining, setIsJoining] = useState(false);
  
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
                if (prevGame && prevGame.status === 'waiting' && newGame.status === 'live') {
                    setIsJoining(false);
                }
                // Only show confetti if the winner has just been decided
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
    }, (error) => {
        console.error("Failed to subscribe to game updates:", error);
        toast({ title: "Error fetching game", variant: "destructive" });
    });

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [authLoading, player, gameId, router, toast, handleBeforeUnload]);
  
  const handleJoinGame = async () => {
    if (player && game && game.status === 'waiting') {
      setIsJoining(true);
      await joinGameAction(game.id, player);
      // No need to router.push, the onSnapshot will update the state
    }
  };

  const handleForfeit = async () => {
    if (!player || !game) return;
    await forfeitGameAction(game.id, player.uid);
  };

  const handleMakeMove = async (localBoardIndex: number, cellIndex: number) => {
    if (!game || !player) return;

    const isPlayerX = player.uid === game.xPlayer.uid;
    const playerSymbol = isPlayerX ? 'X' : 'O';
    const isPlayerTurn = game.nextTurn === playerSymbol && game.status === 'live';
    const isSpectator = !isPlayerX && !(player.uid === game.oPlayer?.uid);

    if (!isPlayerTurn || isSpectator) return;
    
    // Optimistic UI update
    const previousGame = game;
    const move = { gameId: game.id, player: playerSymbol, localBoardIndex, cellIndex };
    const optimisticGame = applyMove(game, move);
    setGame(optimisticGame);

    const result = await makeMoveAction(game.id, move);

    if (!result.success) {
      setGame(previousGame); // Revert on error
      toast({
        title: "Invalid Move",
        description: result.message,
        variant: "destructive",
      });
    }
    // On success, we don't need to do anything, the onSnapshot listener will handle the update
  };


  if (authLoading || !game || !player) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }
  
  const isPlayerX = player.uid === game.xPlayer.uid;
  const isPlayerO = player.uid === game.oPlayer?.uid;
  
  if (game.status === 'waiting') {
    // Player X is waiting for an opponent
    if (isPlayerX) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
          <h2 className="text-2xl font-headline">Waiting for an opponent to join...</h2>
          <p className="text-muted-foreground">Share the game ID or have them find it in the lobby.</p>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    // Another player (not X or O yet) is viewing the waiting game
    if (!isPlayerO) {
       return (
         <div className="flex flex-col items-center justify-center h-full gap-4">
           <h2 className="text-2xl font-headline">{game.xPlayer.name} is waiting for an opponent.</h2>
           <Button onClick={handleJoinGame} disabled={isJoining}>
            {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Join as Player O
           </Button>
         </div>
       );
    }
  }
  
  const isSpectator = !isPlayerX && !isPlayerO;
  const playerSymbol = isPlayerX ? 'X' : 'O';
  const isPlayerTurn = game.nextTurn === playerSymbol && game.status === 'live';

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
                    onMakeMove={handleMakeMove}
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
