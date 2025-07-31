import Link from 'next/link';
import { Swords } from 'lucide-react';

export function Header() {
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
      </div>
    </header>
  );
}
