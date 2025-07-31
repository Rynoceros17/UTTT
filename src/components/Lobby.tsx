'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createGameAction, getGamesAction } from '@/actions/gameActions';
import type { Player, Game } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Users, LogIn, PlusCircle } from 'lucide-react';

export default function Lobby() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const storedPlayer = localStorage.getItem('ttt-player');
    if (storedPlayer) {
      setPlayer(JSON.parse(storedPlayer));
    }
    fetchGames();
    
    const interval = setInterval(fetchGames, 5000); // Poll for new games
    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    const gameList = await getGamesAction();
    setGames(gameList);
  };

  const handleSetPlayer = () => {
    if (playerName.trim()) {
      const newPlayer = { id: Math.random().toString(36).substring(2, 9), name: playerName };
      localStorage.setItem('ttt-player', JSON.stringify(newPlayer));
      setPlayer(newPlayer);
      toast({ title: `Welcome, ${playerName}!` });
    } else {
      toast({
        title: "Please enter a name.",
        variant: "destructive",
      });
    }
  };

  const handleCreateGame = async () => {
    if (player) {
      try {
        const gameId = await createGameAction(player);
        toast({ title: "Game created!", description: `Room ID: ${gameId}` });
        router.push(`/game/${gameId}`);
      } catch (error) {
        toast({ title: "Error creating game", variant: "destructive" });
      }
    }
  };

  if (!player) {
    return (
      <Card className="max-w-md mx-auto mt-10 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-center">Enter the Arena</CardTitle>
          <CardDescription className="text-center">Choose your name to start playing.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            type="text"
            placeholder="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSetPlayer()}
            className="text-center"
          />
          <Button onClick={handleSetPlayer} className="w-full">
            <LogIn className="mr-2 h-4 w-4" /> Set Name & Enter
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div >
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
                    <Button asChild variant="secondary">
                      <Link href={`/game/${game.id}`}>Join</Link>
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
                            <Button asChild variant="outline">
                            <Link href={`/game/${game.id}`}>Spectate</Link>
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
