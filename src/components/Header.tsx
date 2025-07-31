
'use client';

import Link from 'next/link';
import { Swords, LogOut } from 'lucide-react';
import { ProfileDialog } from './ProfileDialog';
import { useState } from 'react';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { PlayerAvatar } from './PlayerAvatar';
import { Skeleton } from './ui/skeleton';

export function Header() {
  const { user, player, loading } = useAuth();
  const [isProfileOpen, setProfileOpen] = useState(false);

  const handleSignOut = async () => {
    await auth.signOut();
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
          {loading ? (
            <Skeleton className="h-10 w-28" />
          ) : user && player ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-muted">
                  <PlayerAvatar player={player} className="h-8 w-8" />
                  <span className="font-semibold">{player.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => setProfileOpen(true)}>
              Sign In
            </Button>
          )}
        </div>
      </div>
      <ProfileDialog
        isOpen={isProfileOpen}
        onOpenChange={setProfileOpen}
        isEdit={!!player}
      />
    </header>
  );
}
