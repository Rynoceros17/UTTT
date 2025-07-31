import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'Tactical Tic-Tac-Toe',
  description: 'The ultimate multiplayer Tic-Tac-Toe experience.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground h-full flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-6">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
