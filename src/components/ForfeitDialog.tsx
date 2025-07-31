'use client';
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
  result: {
    summary: string;
    message: string;
  };
}

export function ForfeitDialog({ isOpen, onClose, result }: ForfeitDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Game Forfeited</AlertDialogTitle>
          <AlertDialogDescription>
            {result.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="prose prose-sm max-h-60 overflow-y-auto rounded-md border p-4">
            <h4 className="font-bold">Game Summary:</h4>
            <p>{result.summary}</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
