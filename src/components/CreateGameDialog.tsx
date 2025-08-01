
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { createGameAction } from '@/actions/gameActions';
import { Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

interface CreateGameDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const TIME_OPTIONS = [
  { value: '300', label: '5 minutes' },
  { value: '600', label: '10 minutes' },
  { value: '900', label: '15 minutes' },
  { value: 'unlimited', label: 'Unlimited' },
];

export function CreateGameDialog({ isOpen, onOpenChange }: CreateGameDialogProps) {
  const { player } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [timeLimit, setTimeLimit] = useState<string>('600');
  const [isCreating, setIsCreating] = useState(false);
  
  const handleCreateGame = async () => {
    if (!player) return;
    setIsCreating(true);
    try {
      const selectedTime = timeLimit === 'unlimited' ? undefined : parseInt(timeLimit, 10);
      const gameId = await createGameAction(player, selectedTime);
      onOpenChange(false);
      router.push(`/game/${gameId}`);
    } catch (error) {
        toast({ title: 'Failed to create game', variant: 'destructive'});
    } finally {
        setIsCreating(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Game</DialogTitle>
            <DialogDescription>
              Choose a time limit for each player. The clock runs during a player's turn.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RadioGroup value={timeLimit} onValueChange={setTimeLimit}>
                {TIME_OPTIONS.map(opt => (
                    <div key={opt.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt.value} id={`time-${opt.value}`} />
                        <Label htmlFor={`time-${opt.value}`}>{opt.label}</Label>
                    </div>
                ))}
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>Cancel</Button>
            <Button onClick={handleCreateGame} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Game
            </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
