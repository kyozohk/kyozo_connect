
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { deleteCommunityFromFirestore } from '@/app/fire/actions';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { CommunityHeader } from '@/components/communities/community-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, LayoutGrid, TrendingUp, MessagesSquare, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Community, Member } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';


type DialogStatus = 'idle' | 'confirming-delete' | 'deleting' | 'delete-success' | 'delete-error';

interface DialogState {
  status: DialogStatus;
  message: string | null;
}

const INITIAL_DIALOG_STATE: DialogState = {
  status: 'idle',
  message: null,
};

export default function CommunityOverviewPage({ params }: { params: { slug: string } }) {
  // In Next.js 15, params properties should be unwrapped with React.use
  // But we need to cast it to the correct type first
  const resolvedParams = React.use(params as unknown as Promise<{ slug: string }>);
  const { slug } = resolvedParams;
  const router = useRouter();
  const firestore = useFirestore();
  const [dialogState, setDialogState] = useState<DialogState>(INITIAL_DIALOG_STATE);
  
  // Query communities by slug or ID
  const communitiesQuery = firestore ? query(
    collection(firestore, 'communities')
  ) : null;
  
  // Use real-time collection hook for communities
  const { data: communities, loading: communitiesLoading } = useCollection<Community>(communitiesQuery);
  
  // Find the current community by slug or ID
  const community = communities?.find(c => {
    // Check if the slug matches directly
    if (c.data?.slug === slug) return true;
    // Check if the ID matches
    if (c.id === slug) return true;
    // Check if the slug is stored in the data object
    return false;
  }) || null;
  
  // If we have a community, query its members
  const membersQuery = community && firestore ? 
    query(collection(firestore, 'memberships'), where('communityId', '==', community.id)) : 
    null;
  
  // Use real-time collection hook for members
  const { data: members, loading: membersLoading } = useCollection<Member>(membersQuery);
  
  // Combined loading state
  const loading = communitiesLoading || membersLoading || !community;
  
  // Redirect to 404 if community not found and not loading
  if (!communitiesLoading && !community) {
    notFound();
  }
  
  const handleDeleteRequest = () => {
    setDialogState({ status: 'confirming-delete', message: null });
  };

  const handleDelete = async () => {
    if (!community) return;

    setDialogState(prevState => ({ ...prevState, status: 'deleting' }));
    
    const result = await deleteCommunityFromFirestore(community.id);

    if (result.success) {
        setDialogState({ status: 'delete-success', message: result.message });
    } else {
        setDialogState({ status: 'delete-error', message: result.message });
    }
  };

  const closeDialog = () => {
    const status = dialogState.status;
    setDialogState(INITIAL_DIALOG_STATE);
    if (status === 'delete-success') {
      router.push('/communities');
      router.refresh();
    }
  };

  if (loading || !community) {
    return (
       <div className="flex h-[80vh] w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const messageCount = (community as any).messageCount || 0;

  const stats = [
    { title: 'Total Members', value: members?.length || 0, icon: Users },
    { title: 'Communities', value: 0, icon: LayoutGrid }, // Placeholder
    { title: 'Monthly Growth', value: "+0", icon: TrendingUp }, // Placeholder
    { title: 'Daily Messages', value: 0, icon: MessagesSquare }, // Placeholder
  ];
  
  const isProcessing = dialogState.status === 'deleting';


  const renderDialogContent = () => {
    const { status, message } = dialogState;

    switch(status) {
        case 'confirming-delete':
            return (
                 <>
                <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                     <DialogDescription>
                         This will permanently delete "{community?.name}" and all its data from Firestore.
                    </DialogDescription>
                </DialogHeader>
                 <div className="py-4 text-sm text-destructive">
                    <p>This action is irreversible and will delete:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>The main community document.</li>
                        <li>All messages in the community channel.</li>
                        <li>All membership records for this community.</li>
                    </ul>
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={closeDialog}>Cancel</Button> 
                    <Button variant="destructive" onClick={handleDelete}>Confirm & Delete</Button>
                </DialogFooter>
                </>
            );
        case 'deleting':
             return (
                 <div className="py-8 flex flex-col items-center justify-center gap-4">
                     <Loader2 className="h-12 w-12 animate-spin text-primary" />
                     <p className="text-muted-foreground">Deleting community, please wait...</p>
                 </div>
            );
        case 'delete-success':
            return (
                 <div className="py-8 flex flex-col items-center justify-center gap-4">
                     <CheckCircle2 className="h-12 w-12 text-green-500" />
                     <h3 className="text-lg font-medium">Deletion Successful</h3>
                     <p className="text-muted-foreground text-center">{message}</p>
                     <Button onClick={closeDialog}>Close</Button>
                 </div>
            );
        case 'delete-error':
            return (
                 <div className="py-8 flex flex-col items-center justify-center gap-4">
                     <AlertCircle className="h-12 w-12 text-destructive" />
                     <h3 className="text-lg font-medium">Deletion Failed</h3>
                     <p className="text-muted-foreground text-center bg-destructive/10 p-3 rounded-md">{message}</p>
                     <Button onClick={closeDialog}>Close</Button>
                 </div>
            );
        default:
            return null;
    }
  }

  return (
    <div className="flex-1">
      <CommunityHeader community={community} onDelete={handleDeleteRequest} />
      <div className="p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Dialog open={dialogState.status !== 'idle'} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent onPointerDownOutside={(e) => isProcessing && e.preventDefault()} onInteractOutside={(e) => isProcessing && e.preventDefault()} className="max-w-md">
              {renderDialogContent()}
          </DialogContent>
      </Dialog>
    </div>
  );
}
