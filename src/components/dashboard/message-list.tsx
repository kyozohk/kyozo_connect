'use client';

import { useEffect, useState, useRef } from 'react';
import { getMessages, summarizeMessages } from '@/app/actions';
import { useAuth } from '@/hooks/use-auth';
import { Message } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Wand2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { formatDistanceToNow } from 'date-fns';

export function MessageList({ communityId, communityName }: { communityId: string, communityName?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!communityId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getMessages(communityId)
      .then((msgs) => {
        setMessages(msgs);
        setTimeout(() => {
          if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
          }
        }, 100);
      })
      .finally(() => setLoading(false));
  }, [communityId]);
  
  const handleSummarize = async () => {
    if (!user || messages.length === 0) return;
    setIsSummarizing(true);
    setIsSummaryDialogOpen(true);
    setSummary('');

    try {
      const result = await summarizeMessages({
        communityId,
        userId: user.uid,
        messages: messages.map(m => ({ sender: m.sender.displayName, text: m.text })),
      });
      setSummary(result.summary);
    } catch(e) {
      setSummary('Sorry, we were unable to generate a summary.');
      console.error(e);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold tracking-tight">{communityName || 'Messages'}</h2>
        <Button onClick={handleSummarize} disabled={isSummarizing || messages.length === 0} size="sm">
          {isSummarizing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Summarize
        </Button>
      </header>
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="space-y-4 p-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-64" />
                  </div>
                </div>
              ))
            ) : messages.length > 0 ? (
              messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-3">
                  <Avatar>
                    <AvatarImage src={message.sender.photoURL} alt={message.sender.displayName} />
                    <AvatarFallback>{message.sender.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-baseline space-x-2">
                        <p className="text-sm font-medium">{message.sender.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                    <p className="text-sm text-foreground/90">{message.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conversation Summary</DialogTitle>
            <DialogDescription>
              Here's a quick summary of the latest messages in {communityName}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isSummarizing ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <p className="text-sm text-foreground/90">{summary}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
