'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCommunityFromFirestore } from '@/app/fire/actions';
import { Community, Member } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

type DialogStatus = 'idle' | 'confirming-delete' | 'deleting' | 'delete-success' | 'delete-error';

interface DialogState {
  status: DialogStatus;
  message: string | null;
}

const INITIAL_DIALOG_STATE: DialogState = {
  status: 'idle',
  message: null,
};

interface CommunityDetailClientProps {
  community: Community;
  members: Member[];
}

export function CommunityDetailClient({ community }: CommunityDetailClientProps) {
  const router = useRouter();
  const [dialogState, setDialogState] = useState<DialogState>(INITIAL_DIALOG_STATE);
  
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
  };

  return (
    <>
      <div className="p-8 pt-0">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-destructive hover:bg-destructive/10"
          onClick={handleDeleteRequest}
        >
          Delete Community
        </Button>
      </div>
      
      <Dialog open={dialogState.status !== 'idle'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent 
          onPointerDownOutside={(e) => isProcessing && e.preventDefault()} 
          onInteractOutside={(e) => isProcessing && e.preventDefault()} 
          className="max-w-md"
        >
          {renderDialogContent()}
        </DialogContent>
      </Dialog>
    </>
  );
}
