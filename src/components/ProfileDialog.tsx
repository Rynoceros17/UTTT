
'use client';

import { useState, useEffect } from 'react';
import type { Player } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#84cc16', // lime-500
  '#22c55e', // green-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
];

interface ProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (player: Player) => void;
  currentPlayer: Player | null;
}

export function ProfileDialog({ isOpen, onOpenChange, onSave, currentPlayer }: ProfileDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState('User'); // Default icon
  const { toast } = useToast();

  useEffect(() => {
    if (currentPlayer) {
      setName(currentPlayer.name);
      setColor(currentPlayer.color);
      setIcon(currentPlayer.icon);
    } else {
      // Set defaults for new players
      setName('');
      setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
      setIcon('User');
    }
  }, [currentPlayer, isOpen]);

  const handleSave = () => {
    if (name.trim().length < 2) {
      toast({
        title: 'Invalid Name',
        description: 'Your name must be at least 2 characters long.',
        variant: 'destructive',
      });
      return;
    }

    const newPlayer: Player = {
      id: currentPlayer?.id || Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      icon,
      color,
    };
    
    localStorage.setItem('ttt-player', JSON.stringify(newPlayer));
    // Dispatch a storage event to notify other components like the Header
    window.dispatchEvent(new Event('storage'));
    
    onSave(newPlayer);
    toast({ title: `Profile saved! Welcome, ${newPlayer.name}.` });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{currentPlayer ? 'Edit Profile' : 'Create Your Profile'}</DialogTitle>
          <DialogDescription>
            Choose your name, color, and icon to be displayed in the game.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your display name"
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={cn(
                    'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                    color === c ? 'border-ring' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          {/* Icon selection can be added here in the future */}
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Profile</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
