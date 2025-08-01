
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import type { ChatMessage } from '@/types';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export function ChatBox({ messages, onSendMessage }: ChatBoxProps) {
  const { player } = useAuth();
  const [newMessage, setNewMessage] = React.useState('');
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = () => {
    const trimmedMessage = newMessage.trim();
    if (trimmedMessage === '' || !player) return;
    onSendMessage(trimmedMessage);
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
    <Card className="flex flex-col h-[70vh] w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-lg">Game Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-2 overflow-hidden px-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-1.5 pb-2">
            {messages.map((msg, index) => {
              const isOwn = msg.senderId === player?.uid;
              return (
                <div
                  key={index}
                  className={cn(
                    'flex flex-col',
                    isOwn ? 'items-end' : 'items-start'
                  )}
                >
                  {!isOwn && <span className="text-xs text-muted-foreground ml-2 mb-0.5">{msg.senderName}</span>}
                  <div
                    className={cn(
                      'px-3 py-1.5 rounded-lg max-w-[80%] text-sm leading-snug break-words',
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground pt-6 text-sm">No messages yet. Say hi!</p>
            )}
          </div>
        </ScrollArea>
        <form
          onSubmit={handleFormSubmit}
          className="flex items-center gap-2 px-4 pt-2 border-t"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            autoComplete="off"
            className="flex-1 h-8 text-sm"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()} className="h-8 w-8">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
