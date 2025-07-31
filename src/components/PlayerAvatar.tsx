
'use client';
import { cn } from '@/lib/utils';
import type { Player } from '@/types';
import { Camera, CircleUser, Crown, Shield, Swords, User } from 'lucide-react';
import * as React from 'react';

const ICONS = {
  Swords: <Swords />,
  Crown: <Crown />,
  Shield: <Shield />,
  Camera: <Camera />,
  CircleUser: <CircleUser />,
  User: <User />,
};

type IconName = keyof typeof ICONS;

export const PlayerAvatar = ({ player, className }: { player: Player, className?: string }) => {
  const IconComponent = ICONS[player.icon as IconName] || ICONS['User'];
  
  return (
    <div 
      className={cn("flex items-center justify-center rounded-full", className)} 
      style={{ backgroundColor: player.color }}
    >
      {React.cloneElement(IconComponent, { className: "h-2/3 w-2/3 text-white"})}
    </div>
  );
};
