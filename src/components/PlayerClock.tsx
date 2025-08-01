
'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerClockProps {
  remainingTime: number;
  isActive: boolean;
  className?: string;
}

function formatTime(seconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function PlayerClock({ remainingTime, isActive, className }: PlayerClockProps) {
  const isLowTime = remainingTime < 60;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md px-2.5 py-1 text-lg font-mono font-semibold transition-colors',
        isActive ? 'bg-primary/20 text-primary-foreground' : 'bg-muted text-muted-foreground',
        isLowTime && isActive && 'bg-destructive text-destructive-foreground animate-pulse',
        className
      )}
    >
      <Clock className="h-5 w-5" />
      <span>{formatTime(remainingTime)}</span>
    </div>
  );
}
