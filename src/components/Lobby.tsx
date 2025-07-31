
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createGameAction, getGamesAction, joinGameAction } from '@/actions/gameActions';
import type { Game } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function Lobby() {
  const { player, loading } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    try {
      const gameList = await getGamesAction();
      setGames(gameList);
    } catch (error) {
      console.error("Failed to fetch games:", error);
      toast({ title: "Could not update game list", variant: "destructive" });
    }
  };

  const handleCreateGame = async () => {
    if (player) {
      await createGameAction(player);
    } else {
      toast({ title: "Please sign in and set your profile first.", variant: "destructive" });
    }
  };

  const handleJoinGame = async (gameId: string) => {
    if (player) {
      await joinGameAction(gameId, player);
    } else {
      toast({ title: "Please sign in and set your profile first.", variant: "destructive" });
    }
  };

  const handleSpectateGame = (gameId: string) => {
    router.push(`/game/${gameId}`);
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    )
  }

  if (!player) {
    return (
      <Card className="max-w-md mx-auto mt-10 shadow-lg text-center">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Welcome to the Arena!</CardTitle>
          <CardDescription>Please sign in to create or join a game.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline text-2xl">Game Lobby</CardTitle>
              <CardDescription>Welcome, {player.name}! Join a game or create a new one.</CardDescription>
            </div>
            <Button onClick={handleCreateGame}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Game
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-headline font-semibold">Available Games</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.filter(g => g.status === 'waiting').map((game) => (
                <Card key={game.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{game.xPlayer.name}'s Game</p>
                      <p className="text-sm text-muted-foreground">Waiting for opponent</p>
                    </div>
                    <Button onClick={() => handleJoinGame(game.id)} variant="secondary" disabled={game.xPlayer.uid === player.uid}>
                      Join
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {games.filter(g => g.status === 'waiting').length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-4">No waiting games. Why not create one?</p>
              )}
            </div>
          </div>
          <div className="space-y-4 mt-8">
            <h3 className="text-lg font-headline font-semibold">Live Games</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.filter(g => g.status === 'live').map((game) => (
                <Card key={game.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{game.xPlayer.name} vs. {game.oPlayer?.name}</p>
                      <p className="text-sm text-muted-foreground">Game in progress</p>
                    </div>
                    <Button onClick={() => handleSpectateGame(game.id)} variant="outline">
                      Spectate
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {games.filter(g => g.status === 'live').length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-4">No live games at the moment.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
