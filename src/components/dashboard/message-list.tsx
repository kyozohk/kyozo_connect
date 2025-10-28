'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { getMessagesForMember, summarizeMessages } from '@/app/actions';
import { getFirestoreMessagesForMember } from '@/app/fire/actions';
import { useAuth } from '@/hooks/use-auth';
import { Message, Member } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Wand2, Loader2, ClipboardCopy, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { formatDistanceToNow } from 'date-fns';
import { DataSource } from './dashboard-client';

export function MessageList({ communityId, communityName, member, dataSource }: { communityId: string, communityName?: string, member: Member | null, dataSource: DataSource }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const currentMemberId = useRef<string | null | undefined>(null);

  useEffect(() => {
    // Only fetch messages if the member has changed OR if the datasource has changed for the same member
    if (member?.id !== currentMemberId.current || dataSource) {
        currentMemberId.current = member?.id;
        if (!communityId || !member?.id) {
          setMessages([]);
          setLoading(false);
          return;
        }
        setLoading(true);
        const fetcher = dataSource === 'firestore' ? getFirestoreMessagesForMember : getMessagesForMember;
        fetcher(communityId, member.id)
          .then((msgs) => {
            setMessages(msgs);
          })
          .catch(err => {
            console.error(err);
            toast({
              title: "Error",
              description: "Could not load messages.",
              variant: "destructive"
            });
          })
          .finally(() => setLoading(false));
    }
  }, [communityId, member, toast, dataSource]);
  
  const handleSummarize = async () => {
    if (!user || messages.length === 0 || !member) return;
    setIsSummarizing(true);
    setIsSummaryDialogOpen(true);
    setSummary('');

    try {
      const result = await summarizeMessages({
        communityId,
        userId: user.uid,
        messages: messages.map(m => ({ sender: m.sender.displayName || 'Unknown', text: m.text })),
      });
      setSummary(result.summary);
    } catch(e) {
      setSummary('Sorry, we were unable to generate a summary.');
      console.error(e);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopy = (message: Message) => {
    navigator.clipboard.writeText(JSON.stringify(message.data, null, 2));
    toast({
      title: 'Copied to clipboard',
      description: `Message data has been copied.`,
    });
  };

  const filteredMessages = useMemo(() => messages.filter((message) =>
    message.text && message.text.toLowerCase().includes(searchQuery.toLowerCase())
  ), [messages, searchQuery]);

  const messageListTitle = dataSource === 'firestore' 
    ? 'Community Channel' 
    : member 
    ? `Messages with ${member.displayName}` 
    : 'Messages';


  return (
    <div className="flex h-full flex-col bg-card">
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold tracking-tight">{messageListTitle}</h2>
          {member && <p className="text-sm text-muted-foreground">{communityName}</p>}
        </div>
        <Button onClick={handleSummarize} disabled={isSummarizing || messages.length === 0 || !member} size="sm">
          {isSummarizing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Summarize
        </Button>
      </header>
      <div className="p-4 border-b">
        <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
            disabled={!member}
        />
      </div>
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
            ) : !member && dataSource === 'mongodb' ? (
                <div className="flex flex-col h-full items-center justify-center text-center p-8 mt-10">
                    <MessageSquare className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold">Select a member</h3>
                    <p className="text-muted-foreground">Choose a member from the list to view their messages.</p>
                </div>
            ) : !communityId ? (
                 <div className="flex flex-col h-full items-center justify-center text-center p-8 mt-10">
                    <MessageSquare className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold">Select a Community</h3>
                    <p className="text-muted-foreground">Choose a community to view messages.</p>
                </div>
            ) : filteredMessages.length > 0 ? (
              filteredMessages.map((message) => (
                <div key={message.id} className="group flex items-start space-x-3">
                  <Avatar>
                    <AvatarImage src={message.sender.photoURL} alt={message.sender.displayName} />
                    <AvatarFallback>{message.sender.displayName?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-baseline space-x-2">
                        <p className="text-sm font-medium">{message.sender.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{message.text}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 flex-shrink-0"
                    onClick={() => handleCopy(message)}
                  >
                    <ClipboardCopy className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No messages found.</p>
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
              {`Here's a quick summary of the messages in ${communityName}.`}
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
