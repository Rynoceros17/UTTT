
'use client';

// This component is not currently in use.
// It can be used to display a dialog when a game is forfeited.
// You would typically show a summary of the game and the reason for the forfeit.

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ForfeitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string;
  message: string;
}

export function ForfeitDialog({ isOpen, onClose, summary, message }: ForfeitDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Game Forfeited</AlertDialogTitle>
          <AlertDialogDescription>
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="prose prose-sm max-h-60 overflow-y-auto rounded-md border p-4">
            <h4 className="font-bold">Game Summary:</h4>
            <p>{summary}</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
