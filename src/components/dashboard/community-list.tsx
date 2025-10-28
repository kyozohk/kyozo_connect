
'use client';

import { Community } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { ClipboardCopy, UploadCloud, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Users, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { isCommunityExported, migrateCommunityToFirestore, getCommunityExportData, type CommunityExportDataResult } from '@/app/actions';
import { deleteCommunityFromFirestore } from '@/app/fire/actions';
import { useRouter } from 'next/navigation';
import { Textarea } from '../ui/textarea';
import { cn } from '@/lib/utils';

interface CommunityListProps {
  communities: Community[];
  selectedCommunityId: string;
  onSelectCommunity: (id: string | null) => void;
  showExport: boolean;
}

type DialogStatus = 'idle' | 'confirming-export' | 'exporting' | 'export-success' | 'export-error' | 'confirming-delete' | 'deleting' | 'delete-success' | 'delete-error';

type LoadingStep = 'community' | 'members' | 'messages';

interface DialogState {
  status: DialogStatus;
  community: Community | null;
  message: string | null;
  exportedData: string | null;
  destination: 'Development' | 'Production';
  loadingSteps: Record<LoadingStep, boolean>;
}

const INITIAL_DIALOG_STATE: DialogState = {
  status: 'idle',
  community: null,
  message: null,
  exportedData: null,
  destination: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
  loadingSteps: {
    community: false,
    members: false,
    messages: false,
  }
};

export function CommunityList({
  communities,
  selectedCommunityId,
  onSelectCommunity,
  showExport,
}: CommunityListProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [exportedStatusMap, setExportedStatusMap] = useState<Record<string, boolean>>({});
  const [checkingExportStatus, setCheckingExportStatus] = useState<Record<string, boolean>>({});
  const [dialogState, setDialogState] = useState<DialogState>(INITIAL_DIALOG_STATE);
  
  const checkAllExportStatus = useCallback(async () => {
    if (!showExport) return;
    const initialStatus: Record<string, boolean> = {};
    communities.forEach(c => initialStatus[c.id] = false);
    setCheckingExportStatus(initialStatus);

    await Promise.all(communities.map(async (community) => {
        try {
            const isExported = await isCommunityExported(community.id);
            setExportedStatusMap(prev => ({...prev, [community.id]: isExported}));
        } catch {
            setExportedStatusMap(prev => ({...prev, [community.id]: false}));
        } finally {
            setCheckingExportStatus(prev => ({...prev, [community.id]: false}));
        }
    }));
  }, [communities, showExport]);


  useEffect(() => {
    if(communities.length > 0 && showExport){
      // checkAllExportStatus();
    }
  }, [communities, checkAllExportStatus, showExport]);

  const handleCopy = (textToCopy: string, successMessage: string) => {
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: 'Copied to clipboard',
      description: successMessage,
    });
  };
  
  const processExportDataStream = async (communityId: string) => {
    try {
        const response = await fetch('/api/export-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ communityId }),
        });

        if (!response.body) {
            throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            
            const parts = buffer.split('\n\n');
            buffer = parts.pop() || ''; // The last part might be incomplete

            for (const part of parts) {
                if (part.startsWith('data: ')) {
                    try {
                        const jsonString = part.substring(6);
                        const chunk = JSON.parse(jsonString);
                        if (chunk.step) {
                            setDialogState(prevState => ({
                                ...prevState,
                                loadingSteps: {
                                    ...prevState.loadingSteps,
                                    [chunk.step]: true
                                }
                            }));
                        } else if (chunk.data) {
                             const result: CommunityExportDataResult = {
                                success: true,
                                message: 'Preview loaded.',
                                exportData: JSON.stringify(chunk.data, null, 2),
                            }
                            if (result.success) {
                                setDialogState(prevState => ({ ...prevState, exportedData: result.exportData, message: null }));
                            } else {
                                setDialogState(prevState => ({ ...prevState, status: 'export-error', message: result.message, exportedData: result.exportData }));
                            }
                        } else if (chunk.error) {
                             setDialogState(prevState => ({ ...prevState, status: 'export-error', message: chunk.error, exportedData: JSON.stringify(chunk.details || {}, null, 2) }));
                        }
                    } catch (e) {
                        console.error("Error parsing stream chunk:", e, "Chunk:", part);
                    }
                }
            }
        }
    } catch (error: any) {
        setDialogState(prevState => ({ ...prevState, status: 'export-error', message: error.message || "An unexpected error occurred while fetching the preview.", exportedData: null }));
    }
}


  const confirmExport = async (community: Community) => {
    setDialogState({
        ...INITIAL_DIALOG_STATE,
        status: 'confirming-export',
        community: community,
        destination: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
    });
    processExportDataStream(community.id);
  }


  const confirmDelete = (community: Community) => {
    setDialogState({
        ...INITIAL_DIALOG_STATE,
        status: 'confirming-delete',
        community: community,
    });
  }

  const handleExport = async () => {
    if (!dialogState.community) return;

    setDialogState(prevState => ({ ...prevState, status: 'exporting', message: null, exportedData: null }));
    
    try {
      const result = await migrateCommunityToFirestore(dialogState.community.id);
       if (result.success) {
        setDialogState(prevState => ({ ...prevState, status: 'export-success', message: result.message, exportedData: result.exportedData }));
        setExportedStatusMap(prev => ({...prev, [dialogState.community!.id]: true}));
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
       setDialogState(prevState => ({ ...prevState, status: 'export-error', message: error.message || 'An unexpected error occurred.', exportedData: error.exportedData }));
    }
  };

  const handleDelete = async () => {
    if (!dialogState.community) return;

    setDialogState(prevState => ({ ...prevState, status: 'deleting', message: null }));

    try {
      const result = await deleteCommunityFromFirestore(dialogState.community.id);
      if (result.success) {
        setDialogState(prevState => ({ ...prevState, status: 'delete-success', message: result.message }));
        onSelectCommunity(null); // Deselect the community
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      setDialogState(prevState => ({ ...prevState, status: 'delete-error', message: error.message || 'An unknown error occurred.' }));
    }
  }
  
  const closeDialog = () => {
    const status = dialogState.status;
    if (status !== 'exporting' && status !== 'deleting') {
        if(status === 'delete-success') {
          // force a reload by navigating
          window.location.reload();
        }
        setDialogState(INITIAL_DIALOG_STATE);
    }
  }

  const filteredCommunities = communities.filter((community) =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const isDialogActive = dialogState.status !== 'idle';
  const isProcessing = dialogState.status === 'exporting' || dialogState.status === 'deleting';

  const renderDialogContent = () => {
    const { status, community, destination, message, exportedData, loadingSteps } = dialogState;

    const loadingChecklist = [
        { key: 'community', label: 'Fetching community data...' },
        { key: 'members', label: 'Fetching members...' },
        { key: 'messages', label: 'Fetching messages...' },
    ];

    switch(status) {
        case 'confirming-export':
        case 'exporting':
        case 'export-success':
        case 'export-error':
            return (
                <>
                <DialogHeader>
                    <DialogTitle>
                        {status === 'confirming-export' && 'Confirm Migration'}
                        {status === 'exporting' && 'Migrating Community'}
                        {status === 'export-success' && 'Migration Complete'}
                        {status === 'export-error' && 'Migration Failed'}
                    </DialogTitle>
                    <DialogDescription>
                         {status === 'confirming-export' && `Review the data below, then confirm to migrate "${community?.name}" to the ${destination} Firestore database.`}
                         {status === 'exporting' && `Exporting "${community?.name}" to the ${destination} environment. This may take a few minutes.`}
                         {status === 'export-success' && `Successfully migrated "${community?.name}" to Firestore.`}
                         {status === 'export-error' && `Something went wrong while migrating "${community?.name}".`}
                    </DialogDescription>
                </DialogHeader>
                 {(status === 'confirming-export' || status === 'export-success' || status === 'export-error') && exportedData && (
                    <div className="relative py-4">
                        <Textarea
                            readOnly
                            value={exportedData}
                            className="h-64 text-xs font-mono bg-secondary border-secondary"
                        />
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-6 right-2 h-7 w-7"
                            onClick={() => handleCopy(exportedData, "Exported JSON data copied.")}
                        >
                            <ClipboardCopy className="h-4 w-4"/>
                        </Button>
                    </div>
                )}
                {(status === 'confirming-export' && !exportedData && status !== 'export-error') && (
                    <div className="py-4 space-y-4">
                        <div className="flex flex-col items-start justify-center p-4 min-h-[10rem]">
                            {loadingChecklist.map(step => (
                                <div key={step.key} className="flex items-center space-x-3 mb-2">
                                    {loadingSteps[step.key as LoadingStep] ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    )}
                                    <span className={cn("text-sm", loadingSteps[step.key as LoadingStep] ? 'text-muted-foreground' : 'text-foreground')}>
                                        {step.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {status === 'exporting' && (
                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-center h-24">
                           <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    </div>
                )}
                 {(status === 'export-success' || status === 'export-error') && message && (
                     <div className="text-sm text-muted-foreground py-2">{message}</div>
                 )}
                {status === 'export-error' && message && (
                     <div className="py-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                        <p className="font-semibold">Error Details:</p>
                        <p>{message}</p>
                    </div>
                )}
                <DialogFooter>
                    {status === 'confirming-export' && ( <> <Button variant="outline" onClick={closeDialog}>Cancel</Button> <Button onClick={handleExport} disabled={!exportedData}>Confirm & Migrate</Button> </> )}
                    {status === 'exporting' && ( <Button disabled> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Migrating... </Button> )}
                    {status === 'export-success' && ( <div className='flex w-full justify-between'><Button variant="outline" onClick={closeDialog}>Close</Button> <Button onClick={() => router.push('/fire')}>Go to Destination <ArrowRight className="ml-2 h-4 w-4" /></Button></div> )}
                    {status === 'export-error' && ( <Button onClick={closeDialog}>Close</Button> )}
                </DialogFooter>
                </>
            );
        case 'confirming-delete':
        case 'deleting':
        case 'delete-success':
        case 'delete-error':
            return (
                 <>
                <DialogHeader>
                    <DialogTitle>
                        {status === 'confirming-delete' && 'Confirm Deletion'}
                        {status === 'deleting' && 'Deleting Community'}
                        {status === 'delete-success' && 'Deletion Complete'}
                        {status === 'delete-error' && 'Deletion Failed'}
                    </DialogTitle>
                     <DialogDescription>
                         {status === 'confirming-delete' && `This will permanently delete "${community?.name}" and all its data from Firestore.`}
                         {(status === 'deleting' || status === 'delete-success') && `Deleting "${community?.name}" from Firestore.`}
                         {status === 'delete-error' && `Something went wrong while deleting "${community?.name}".`}
                    </DialogDescription>
                </DialogHeader>
                 {status === 'confirming-delete' && (
                    <div className="py-4 text-sm text-destructive">
                        <p>This action is irreversible and will delete:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>The main community document.</li>
                            <li>All messages in the community channel.</li>
                            <li>All membership records for this community.</li>
                        </ul>
                    </div>
                )}
                {(status === 'deleting' || status === 'delete-success') && (
                     <div className="py-4 space-y-4 flex items-center justify-center h-24">
                         <Loader2 className="h-8 w-8 animate-spin text-primary" />
                         <p className="ml-4 text-muted-foreground">{status === 'deleting' ? 'Deleting, please wait...' : message}</p>
                     </div>
                )}
                {status === 'delete-error' && (
                    <div className="py-4 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                        <p className="font-semibold">Error Details:</p>
                        <p>{message}</p>
                    </div>
                )}
                 <DialogFooter>
                    {status === 'confirming-delete' && ( <> <Button variant="outline" onClick={closeDialog}>Cancel</Button> <Button variant="destructive" onClick={handleDelete}>Confirm & Delete</Button> </> )}
                    {status === 'deleting' && ( <Button variant="destructive" disabled> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting... </Button> )}
                    {(status === 'delete-success' || status === 'delete-error') && ( <Button onClick={closeDialog}>Close</Button> )}
                </DialogFooter>
                </>
            );
        default:
            return null;
    }
  }


  return (
    <div className="flex h-full flex-col bg-card">
        <div className="p-4 border-b">
            <h2 className="text-lg font-semibold tracking-tight mb-2">Communities</h2>
            <Input
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
            />
        </div>
        <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
            {filteredCommunities.length > 0 ? (
                filteredCommunities.map((community) => (
                <div key={community.id} className="group relative">
                    <div
                        className={`w-full justify-start h-auto py-2 px-2 flex items-center cursor-pointer rounded-md ${selectedCommunityId === community.id ? 'bg-secondary' : ''}`}
                        onClick={() => onSelectCommunity(community.id)}
                    >
                        <Avatar className="mr-3 h-8 w-8">
                            <AvatarImage src={community.communityProfileImage} alt={community.name} />
                            <AvatarFallback>
                                <Users className="h-4 w-4" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex justify-between items-center">
                          <span className="truncate text-sm">{community.name}</span>
                          <div className="flex items-center space-x-2">
                             <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                             <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 flex-shrink-0"
                                onClick={(e) => { e.stopPropagation(); handleCopy(JSON.stringify(community.data, null, 2), `Community data for "${community.name}" has been copied.`); }}
                            >
                                <ClipboardCopy className="h-5 w-5" />
                            </Button>
                            {showExport ? (
                             <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 flex-shrink-0"
                                disabled={exportedStatusMap[community.id] || isProcessing}
                                onClick={(e) => { e.stopPropagation(); confirmExport(community); }}
                            >
                                <UploadCloud className="h-6 w-6 text-primary" />
                            </Button>
                            ) : (
                             <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 flex-shrink-0"
                                disabled={isProcessing}
                                onClick={(e) => { e.stopPropagation(); confirmDelete(community); }}
                            >
                                <Trash2 className="h-6 w-6 text-destructive" />
                            </Button>
                            )}
                          </div>
                          <Badge variant="outline">{community.memberCount}</Badge>
                          </div>
                        </div>
                    </div>
                </div>
                ))
            ) : (
                <p className="p-4 text-sm text-muted-foreground">No communities found.</p>
            )}
            </div>
        </ScrollArea>
        <Dialog open={isDialogActive} onOpenChange={(open) => !open && closeDialog()}>
            <DialogContent onPointerDownOutside={(e) => isProcessing && e.preventDefault()} onInteractOutside={(e) => isProcessing && e.preventDefault()} className="max-w-md">
                {renderDialogContent()}
            </DialogContent>
        </Dialog>
    </div>
  );
}
