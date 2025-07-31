
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import type { ChatMessage } from '@/types';
import { sendChatMessageAction } from '@/actions/gameActions';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlayerAvatar } from './PlayerAvatar';
import { formatDistanceToNow } from 'date-fns';

interface ChatBoxProps {
  gameId: string;
  messages: ChatMessage[];
}

export function ChatBox({ gameId, messages }: ChatBoxProps) {
  const { player } = useAuth();
  const [newMessage, setNewMessage] = React.useState('');
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Scroll to the bottom whenever messages change
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);


  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !player) return;

    await sendChatMessageAction(gameId, {
      senderId: player.uid,
      senderName: player.name,
      text: newMessage.trim(),
    });

    setNewMessage('');
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[70vh]">
      <CardHeader>
        <CardTitle className="font-headline text-lg">Game Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-2',
                  msg.senderId === player?.uid ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <div className="flex flex-col gap-1">
                  <div
                    className={cn(
                      'p-3 rounded-lg max-w-xs',
                       msg.senderId === player?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    <p className="text-sm font-semibold mb-1">{msg.senderName}</p>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              </div>
            ))}
             {messages.length === 0 && (
                <p className="text-center text-muted-foreground pt-10">No messages yet. Say hi!</p>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2 pt-2 border-t">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
