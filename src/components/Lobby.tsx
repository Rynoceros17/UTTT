
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createGameAction, getGamesAction, joinGameAction } from '@/actions/gameActions';
import type { Player, Game } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Loader2, Swords, Shield, Camera, CircleUser, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { db_firestore } from '@/lib/state';
import * as React from 'react';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899',
];

const ICONS = {
  Swords: <Swords />,
  Crown: <Crown />,
  Shield: <Shield />,
  Camera: <Camera />,
  CircleUser: <CircleUser />,
};
type IconName = keyof typeof ICONS;


const AuthForm = () => {
  const { setPlayer } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState<IconName>('Swords');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

   useEffect(() => {
    setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setIcon('Swords');
  }, []);

  const handleAuth = async () => {
    if (authMode === 'signup') {
      if (name.trim().length < 2) {
        toast({ title: 'Invalid Name', description: 'Name must be at least 2 characters.', variant: 'destructive' });
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newPlayer: Player = {
          uid: userCredential.user.uid,
          name: name.trim(),
          icon,
          color,
        };
        await db_firestore.players.save(newPlayer);
        setPlayer(newPlayer);
        toast({ title: `Welcome, ${newPlayer.name}!` });
      } catch (error: any) {
        toast({ title: 'Sign-up Failed', description: error.message, variant: 'destructive' });
      }
    } else { // signin
      try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Signed in successfully!' });
      } catch (error: any) {
        toast({ title: 'Sign-in Failed', description: error.message, variant: 'destructive' });
      }
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-10 shadow-lg">
      <CardHeader className='text-center'>
        <CardTitle className="font-headline text-2xl">{authMode === 'signin' ? 'Sign In to the Arena!' : 'Join the Arena!'}</CardTitle>
        <CardDescription>
            {authMode === 'signin' ? 'Enter your credentials to continue.' : 'Create an account to start playing.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {authMode === 'signup' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your display name" />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ICONS).map(([name, IconComponent]) => (
                  <button
                    key={name}
                    className={cn(
                      'h-10 w-10 rounded-md border-2 flex items-center justify-center transition-transform hover:scale-110',
                      icon === name ? 'border-ring bg-accent' : 'border-transparent bg-muted'
                    )}
                    onClick={() => setIcon(name as IconName)}
                  >
                    {React.cloneElement(IconComponent as React.ReactElement, { className: "w-6 h-6" })}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button key={c} className={cn('h-8 w-8 rounded-full border-2 transition-transform hover:scale-110', color === c ? 'border-ring' : 'border-transparent')} style={{ backgroundColor: c }} onClick={() => setColor(c)} />
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <Button onClick={handleAuth} className="w-full">{authMode === 'signin' ? 'Sign In' : 'Sign Up'}</Button>
        <Button variant="link" onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>
          {authMode === 'signin' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
        </Button>
      </CardFooter>
    </Card>
  );
}


export default function Lobby() {
  const { player, loading } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!player) return;
    fetchGames();
    const interval = setInterval(fetchGames, 5000);
    
    return () => clearInterval(interval);
  }, [player]);

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
    }
  };

  const handleJoinGame = async (gameId: string) => {
    if (player) {
      await joinGameAction(gameId, player);
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
    return <AuthForm />;
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
