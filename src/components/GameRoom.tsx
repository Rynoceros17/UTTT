
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Game, PlayerSymbol, ChatMessage } from '@/types';
import { joinGameAction, forfeitGameAction, makeMoveAction, sendChatMessageAction, requestRematchAction } from '@/actions/gameActions';
import { applyMove } from '@/lib/gameLogic';
import { useToast } from '@/hooks/use-toast';
import GameBoard from './GameBoard';
import PlayerInfo from './PlayerInfo';
import GameStatus from './GameStatus';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { ChatBox } from './ChatBox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function GameRoom({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<Game | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const { player, loading: authLoading } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [isRequestingRematch, setIsRequestingRematch] = useState(false);
  const [isForfeitConfirmOpen, setForfeitConfirmOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const hasConfettied = useRef(false);

  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
      if (game && game.status === 'live' && player) {
        const isPlayerInGame = game.playerIds.includes(player.uid);
        if (isPlayerInGame) {
          const moveCount = game.localBoards.filter(c => c !== null).length;
          // Only auto-forfeit if the game is substantial
          if (moveCount >= 18) {
            forfeitGameAction(game.id, player.uid);
          }
        }
      }
  }, [game, player]);

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleBeforeUnload]);

  useEffect(() => {
    if (authLoading) return;
    if (!player) {
      router.push('/');
      return;
    }

    const gameDocRef = doc(db, 'games', gameId);
    
    const unsubscribe = onSnapshot(gameDocRef, (doc) => {
        if (doc.exists()) {
            const newGame = doc.data() as Game;
            setGame(newGame);
            setOptimisticMessages(newGame.chat || []);
            
            if (newGame.status === 'waiting' && isJoining) {
                setIsJoining(false);
            }
                
            if (newGame.status === 'finished' && !hasConfettied.current) {
                const playerSymbol = player?.uid === newGame.xPlayer.uid ? 'X' : 'O';
                if (newGame.winner === playerSymbol) {
                    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
                    hasConfettied.current = true;
                }
            }
            
            if (newGame.nextGameId) {
                router.push(`/game/${newGame.nextGameId}`);
            }

        } else {
            toast({ title: "Game not found or has been deleted", variant: "destructive" });
            router.push('/');
        }
    }, (error) => {
        console.error("Failed to subscribe to game updates:", error);
        toast({ title: "Error fetching game data", variant: "destructive" });
    });

    return () => unsubscribe();
  }, [authLoading, player, gameId, router, toast, isJoining]);
  
  const handleJoinGame = async () => {
    if (player && game && game.status === 'waiting') {
      setIsJoining(true);
      const result = await joinGameAction(game.id, player);
      if (!result.success) {
        toast({ title: "Failed to join game", description: result.message, variant: "destructive" });
        setIsJoining(false);
      }
    }
  };

  const handleForfeit = async () => {
    if (!player || !game) return;
    const moveCount = game.localBoards.filter(c => c !== null).length;

    if (moveCount < 18) {
        setForfeitConfirmOpen(true);
    } else {
        await forfeitGameAction(game.id, player.uid);
        router.push('/');
    }
  };

  const confirmForfeit = async () => {
    if (!player || !game) return;
    await forfeitGameAction(game.id, player.uid);
    router.push('/');
  }

  const handleMakeMove = async (localBoardIndex: number, cellIndex: number) => {
    if (!game || !player) return;

    const isPlayerX = player.uid === game.xPlayer.uid;
    const playerSymbol = isPlayerX ? 'X' : 'O';
    const isSpectator = !isPlayerX && !(player.uid === game.oPlayer?.uid);

    if (game.status !== 'live' || isSpectator || game.nextTurn !== playerSymbol) return;
    if (game.activeLocalBoard !== null && game.activeLocalBoard !== localBoardIndex) {
        toast({ title: "Invalid Move", description: "You must play in the highlighted board.", variant: "destructive" });
        return;
    }
    const flatIndex = localBoardIndex * 9 + cellIndex;
    if (game.localBoards[flatIndex] !== null) return;
    
    const previousGame = game;
    const move = { gameId: game.id, player: playerSymbol, localBoardIndex, cellIndex };
    const optimisticGame = applyMove(game, move);
    setGame(optimisticGame);

    const result = await makeMoveAction(game.id, move);

    if (!result.success) {
      setGame(previousGame); 
      toast({ title: "Invalid Move", description: result.message, variant: "destructive" });
    }
  };

  const handleSendMessage = async (text: string) => {
      if (!player || !game) return;
      const optimisticMessage: ChatMessage = {
          senderId: player.uid,
          senderName: player.name,
          text,
          timestamp: Date.now(),
      };
      
      setOptimisticMessages(prev => [...prev, optimisticMessage]);

      await sendChatMessageAction(game.id, {
          senderId: player.uid,
          senderName: player.name,
          text: text,
      });
      // The onSnapshot listener will handle syncing the "official" state.
  };

  const handleRematch = async () => {
    if (!game || !player) return;
    setIsRequestingRematch(true);
    const result = await requestRematchAction(game.id, player.uid);
    if (!result.success) {
        toast({ title: "Failed to request rematch", description: result.message, variant: "destructive" });
        setIsRequestingRematch(false); // Allow retry if it failed
    }
  };

  if (authLoading || !game || !player) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }
  
  const isPlayerX = player.uid === game.xPlayer.uid;
  if (game.status === 'waiting') {
    if (isPlayerX) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
          <h2 className="text-2xl font-headline">Waiting for an opponent...</h2>
          <p className="text-muted-foreground">Share this game ID with a friend:</p>
          <p className="font-bold text-lg p-2 bg-muted rounded-md tracking-widest">{game.id}</p>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <h2 className="text-2xl font-headline">{game.xPlayer.name} is looking for a challenger.</h2>
          <Button onClick={handleJoinGame} disabled={isJoining}>
            {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Join Game
          </Button>
        </div>
    );
  }
  
  const isPlayerO = !!game.oPlayer && player.uid === game.oPlayer.uid;
  const isSpectator = !isPlayerX && !isPlayerO;
  const playerSymbol = isPlayerX ? 'X' : (isPlayerO ? 'O' : 'X');
  const isPlayerTurn = game.nextTurn === playerSymbol && game.status === 'live';
  const hasRequestedRematch = game.rematchRequestedBy?.includes(player.uid);


  const renderPostGameButtons = () => {
    if (game.status !== 'finished' || isSpectator) return null;

    if (hasRequestedRematch) {
        return (
            <Button disabled className="w-full mt-2">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Waiting for opponent...
            </Button>
        );
    }

    return (
        <>
            <Button onClick={handleRematch} disabled={isRequestingRematch} className="w-full mt-2">
                {isRequestingRematch ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Play Again
            </Button>
            <Button onClick={() => router.push('/')} className="w-full" variant="secondary">
                Back to Lobby
            </Button>
        </>
    );
  }

  return (
    <>
    <AlertDialog open={isForfeitConfirmOpen} onOpenChange={setForfeitConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                Not enough moves have been played. If you forfeit now, the game will be deleted and no win/loss will be recorded.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmForfeit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Forfeit
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
      <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
        <PlayerInfo game={game} currentPlayerId={player?.uid} />
        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="font-headline text-lg">Game Info</h3>
            <p><strong>Status:</strong> <span className="capitalize">{game.status}</span></p>
            <p><strong>Game ID:</strong> {game.id}</p>
            {game.status === 'live' && !isSpectator && (
                <Button variant="destructive" className="w-full" onClick={handleForfeit}>Forfeit Game</Button>
            )}
             {renderPostGameButtons()}
          </CardContent>
        </Card>
      </div>
      
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

      <div className="w-full lg:w-80 flex-shrink-0">
        <ChatBox 
            messages={optimisticMessages} 
            onSendMessage={handleSendMessage} 
        />
      </div>
    </div>
    </>
  );
}
