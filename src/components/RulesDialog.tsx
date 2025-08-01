
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';

interface RulesDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function RulesDialog({ isOpen, onOpenChange }: RulesDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Game Rules</DialogTitle>
          <DialogDescription>
            The official rules for Ultimate Tic-Tac-Toe.
          </DialogDescription>
        </DialogHeader>
        <div className="prose prose-sm max-h-[60vh] overflow-y-auto pr-4 text-foreground">
            <h4>Objective</h4>
            <p>
                The goal is to win the main 3x3 grid. You win the main grid by winning three of the smaller 3x3 grids in a row, column, or diagonal, just like in classic Tic-Tac-Toe.
            </p>

            <h4>Gameplay Flow</h4>
            <ul>
                <li>The game is played on a large 3x3 grid, where each cell contains a smaller, classic 3x3 Tic-Tac-Toe board.</li>
                <li>Player X starts the game by placing their mark in any cell on any of the nine local boards.</li>
            </ul>

            <h4>The Twist: Dictating the Next Move</h4>
            <ul>
                <li><strong>This is the most important rule:</strong> The cell you choose on a local board determines which local board your opponent must play in next.</li>
                <li>For example, if you place your 'X' in the top-right cell of a local board, your opponent *must* then place their 'O' in the top-right local board of the main grid.</li>
            </ul>
            
            <h4>Winning a Local Board</h4>
            <ul>
                <li>To win a local board, you must get three of your marks in a row (horizontally, vertically, or diagonally) on that board.</li>
                <li>Once a local board is won, it is marked permanently for the winning player (e.g., with a large 'X' or 'O'). No more moves can be made on that board.</li>
                <li>If a local board results in a draw (all cells are filled with no winner), it is marked as a draw and no one claims it.</li>
            </ul>

            <h4>What if the next board is already won or full?</h4>
            <ul>
                <li>If the cell you're sent to corresponds to a local board that has already been won or is full, your opponent gets a "free move".</li>
                <li>This means they can choose to play on *any* of the other available local boards.</li>
            </ul>

             <h4>Winning the Game</h4>
            <ul>
                <li>You win the entire game by winning three local boards in a row, column, or diagonal on the main grid.</li>
            </ul>
            
             <h4>Draw Condition</h4>
            <ul>
                <li>If all nine local boards are completed (won or drawn) and no player has won the main grid, the entire game is a draw.</li>
            </ul>
            <p className="font-bold text-destructive">Do not play this game in class at school.</p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Got it!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
