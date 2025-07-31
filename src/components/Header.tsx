
'use client';

import Link from 'next/link';
import { Swords, User as UserIcon } from 'lucide-react';
import { ProfileDialog } from './ProfileDialog';
import { useEffect, useState } from 'react';
import type { Player } from '@/types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PlayerAvatar = ({ player, className }: { player: Player, className?: string }) => {
  const Icon = UserIcon;
  return (
    <div className={cn("flex items-center justify-center rounded-full bg-muted", className)} style={{ backgroundColor: player.color }}>
      <Icon className="h-6 w-6 text-white" />
    </div>
  );
};


export function Header() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [isProfileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const storedPlayer = localStorage.getItem('ttt-player');
    if (storedPlayer) {
      setPlayer(JSON.parse(storedPlayer));
    } else {
      setProfileOpen(true);
    }

    const handleStorageChange = () => {
      const updatedPlayer = localStorage.getItem('ttt-player');
      if (updatedPlayer) {
        setPlayer(JSON.parse(updatedPlayer));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleProfileSave = (newPlayer: Player) => {
    setPlayer(newPlayer);
    setProfileOpen(false);
  };
  
  return (
    <header className="py-4 px-6 border-b bg-card shadow-sm sticky top-0 z-20">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="p-2 bg-primary rounded-lg text-primary-foreground group-hover:bg-primary/90 transition-colors">
            <Swords className="h-6 w-6" />
          </div>
          <h1 className="text-xl md:text-2xl font-headline font-bold text-foreground">
            Tactical Tic-Tac-Toe
          </h1>
        </Link>
        <div className="flex items-center gap-4">
            {player ? (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-muted">
                        <PlayerAvatar player={player} className="h-8 w-8"/>
                        <span className="font-semibold">{player.name}</span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                        Edit Profile
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            ) : (
                <button onClick={() => setProfileOpen(true)} className="text-sm font-medium hover:underline">
                    Set Profile
                </button>
            )}
        </div>
      </div>
      <ProfileDialog
        isOpen={isProfileOpen}
        onOpenChange={setProfileOpen}
        onSave={handleProfileSave}
        currentPlayer={player}
      />
    </header>
  );
}
