'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
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
import type { DataSource } from './dashboard-client';
import { summarizeMessages } from '@/app/actions';
import { useUser } from '@/firebase';

export function MessageListClient({ 
  communityId, 
  communityName, 
  member, 
  dataSource 
}: { 
  communityId: string, 
  communityName?: string, 
  member: Member | null, 
  dataSource: DataSource 
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const firestore = useFirestore();
  
  // Use Firestore real-time updates for messages
  useEffect(() => {
    if (!firestore || !communityId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Create a query for messages in the community
    const messagesRef = collection(firestore, 'communities', communityId, 'messages');
    const messagesQuery = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const fetchedMessages: Message[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const sender = {
            id: data.userId,
            uid: data.userId,
            displayName: data.userName || 'Unknown User',
            photoURL: data.userPhotoURL || '',
          };
          
          // Create a message object with sender and recipient information
          fetchedMessages.push({
            id: doc.id,
            text: data.text,
            createdAt: data.createdAt instanceof Timestamp 
              ? data.createdAt.toDate().toISOString() 
              : new Date().toISOString(),
            sender,
            // Include recipient information if available
            recipient: data.recipientId ? {
              id: data.recipientId,
              displayName: data.recipientName || 'Unknown Recipient',
              photoURL: data.recipientPhotoURL || '',
            } : undefined,
            data: data,
          });
        });
        
        // Sort messages by date (newest last)
        const sortedMessages = fetchedMessages.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        setMessages(sortedMessages);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching messages:", error);
        setMessages([]);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [communityId, firestore]);

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

  const filteredMessages = useMemo(() => {
    let filtered = messages;
    
    // Filter by search query if provided
    if (searchQuery) {
      filtered = filtered.filter((message) =>
        message.text && message.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by selected member if a member is selected
    // We want to show messages to/from the selected member regardless of data source
    if (member) {
      filtered = filtered.filter(m => 
        // Show messages from the selected member
        m.sender.id === member.id || 
        // Show messages to the selected member
        m.data?.recipientId === member.id ||
        // Always show system messages
        m.sender.id === 'system'
      );
    }
    
    return filtered;
  }, [messages, searchQuery, member]);

  const messageListTitle = member
    ? `Messages with ${member.displayName}`
    : dataSource === 'firestore'
    ? 'Community Channel'
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
          disabled={!communityId}
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
                      {message.recipient && (
                        <p className="text-xs text-muted-foreground">
                          to {message.recipient.displayName}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : ''}
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
