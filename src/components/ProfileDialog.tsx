
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
import { db_firestore } from '@/lib/state';
import { useAuth } from '@/hooks/use-auth';
import { Camera, CircleUser, Crown, Shield, Swords } from 'lucide-react';
import * as React from 'react';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef',
];

const ICONS = {
  Swords: <Swords />,
  Crown: <Crown />,
  Shield: <Shield />,
  Camera: <Camera />,
  CircleUser: <CircleUser />,
};

type IconName = keyof typeof ICONS;

interface ProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ProfileDialog({ isOpen, onOpenChange }: ProfileDialogProps) {
  const { player, setPlayer, user } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState<IconName>('Swords');

  useEffect(() => {
    if (isOpen && player) {
        setName(player.name);
        setColor(player.color);
        setIcon(player.icon as IconName);
    }
  }, [isOpen, player]);

  const handleProfileUpdate = async () => {
    if (!user || !player) return;
    if (name.trim().length < 2) {
      toast({ title: 'Invalid Name', description: 'Name must be at least 2 characters.', variant: 'destructive' });
      return;
    }
    const updatedPlayer: Player = {
      ...player,
      name: name.trim(),
      icon,
      color,
    };
    await db_firestore.players.save(updatedPlayer);
    setPlayer(updatedPlayer);
    onOpenChange(false);
    toast({ title: 'Profile updated!' });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
         <>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your display name, icon, and color.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                        icon === name ? 'border-ring' : 'border-transparent bg-muted'
                      )}
                      style={icon === name ? { backgroundColor: color } : {}}
                      onClick={() => setIcon(name as IconName)}
                    >
                      {React.cloneElement(IconComponent as React.ReactElement, { className: cn("w-6 h-6", icon === name ? "text-white" : "text-black") })}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleProfileUpdate}>Save Changes</Button>
          </DialogFooter>
        </>
      </DialogContent>
    </Dialog>
  );
}
