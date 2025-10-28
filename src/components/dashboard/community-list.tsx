
'use client';

import { Community } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { ClipboardCopy, UploadCloud } from 'lucide-react';
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
import { isCommunityExported, migrateCommunityToFirestore } from '@/app/actions';
import { Progress } from '@/components/ui/progress';

interface CommunityListProps {
  communities: Community[];
  selectedCommunityId: string;
  onSelectCommunity: (id: string) => void;
  showExport: boolean;
}

type ExportStatus = 'idle' | 'confirming' | 'exporting' | 'success' | 'error';

interface ExportState {
  status: ExportStatus;
  community: Community | null;
  progress: {
    step: string;
    detail: string;
    value: number;
  };
  error: string | null;
  destination: 'Development' | 'Production';
}

const INITIAL_EXPORT_STATE: ExportState = {
  status: 'idle',
  community: null,
  progress: { step: '', detail: '', value: 0 },
  error: null,
  destination: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
};

export function CommunityList({
  communities,
  selectedCommunityId,
  onSelectCommunity,
  showExport,
}: CommunityListProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [exportedStatusMap, setExportedStatusMap] = useState<Record<string, boolean>>({});
  const [checkingExportStatus, setCheckingExportStatus] = useState<Record<string, boolean>>({});
  const [exportState, setExportState] = useState<ExportState>(INITIAL_EXPORT_STATE);
  
  const checkAllExportStatus = useCallback(async () => {
    if (!showExport) return;
    const statusMap: Record<string, boolean> = {};
    const checkingMap: Record<string, boolean> = {};
    for (const community of communities) {
      checkingMap[community.id] = true;
      setCheckingExportStatus({...checkingMap});
    }

    await Promise.all(communities.map(async (community) => {
        try {
            const isExported = await isCommunityExported(community.id);
            statusMap[community.id] = isExported;
        } catch {
            statusMap[community.id] = false;
        }
    }));
    
    setExportedStatusMap(statusMap);
    setCheckingExportStatus({});
  }, [communities, showExport]);

  useEffect(() => {
    if(communities.length > 0){
      checkAllExportStatus();
    }
  }, [communities, checkAllExportStatus]);

  const handleCopy = (community: Community) => {
    navigator.clipboard.writeText(JSON.stringify(community.data, null, 2));
    toast({
      title: 'Copied to clipboard',
      description: `Community data for "${community.name}" has been copied.`,
    });
  };

  const confirmExport = (community: Community) => {
    setExportState({
        ...INITIAL_EXPORT_STATE,
        status: 'confirming',
        community: community,
        destination: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
    });
  }

  const handleExport = async () => {
    if (!exportState.community) return;

    setExportState(prevState => ({ ...prevState, status: 'exporting', error: null, progress: { step: 'Initiating...', detail: 'Please wait, this may take a few minutes.', value: 0 } }));
    
    try {
      // We can't pass a function to a server action, so we won't get granular progress.
      // We just await the final result.
      const result = await migrateCommunityToFirestore(exportState.community.id);
       if (result.success) {
        setExportState(prevState => ({ ...prevState, status: 'success', progress: {...prevState.progress, step: "Complete", detail: result.message, value: 100 }}));
        setExportedStatusMap(prev => ({...prev, [exportState.community!.id]: true}));
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
       setExportState(prevState => ({ ...prevState, status: 'error', error: error.message || 'An unexpected error occurred.' }));
    }
  };
  
  const closeDialog = () => {
    if (exportState.status !== 'exporting') {
        setExportState(INITIAL_EXPORT_STATE);
    }
  }

  const filteredCommunities = communities.filter((community) =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const isExporting = exportState.status === 'exporting';
  const isAnyCommunityExporting = exportState.status === 'exporting' || exportState.status === 'confirming';

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
                <div key={community.id} className="group relative flex items-center rounded-md"
                  onClick={() => onSelectCommunity(community.id)}>
                    <div
                        className={`w-full justify-start flex-grow h-auto py-2 px-2 flex items-center cursor-pointer rounded-md ${selectedCommunityId === community.id ? 'bg-secondary' : ''}`}
                    >
                        <Avatar className="mr-3 h-8 w-8">
                            <AvatarImage src={community.communityProfileImage} alt={community.name} />
                            <AvatarFallback>
                                <Users className="h-4 w-4" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex justify-between items-center">
                          <span className="truncate text-sm">{community.name}</span>
                          <div className="flex items-center">
                            <Badge variant="outline">{community.memberCount}</Badge>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                             <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 flex-shrink-0"
                                onClick={(e) => { e.stopPropagation(); handleCopy(community); }}
                            >
                                <ClipboardCopy className="h-4 w-4" />
                            </Button>
                            {showExport && (
                             <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 flex-shrink-0"
                                disabled={exportedStatusMap[community.id] || isAnyCommunityExporting || checkingExportStatus[community.id]}
                                onClick={(e) => { e.stopPropagation(); confirmExport(community); }}
                            >
                                {checkingExportStatus[community.id] ? <Loader2 className="h-4 w-4 animate-spin"/> : <UploadCloud className="h-4 w-4 text-primary" />}
                            </Button>
                            )}
                          </div>
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
        <Dialog open={exportState.status !== 'idle'} onOpenChange={(open) => !open && closeDialog()}>
            <DialogContent onPointerDownOutside={(e) => isExporting && e.preventDefault()} onInteractOutside={(e) => isExporting && e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>
                        {exportState.status === 'confirming' && 'Confirm Migration'}
                        {exportState.status === 'exporting' && 'Migrating Community'}
                        {exportState.status === 'success' && 'Migration Complete'}
                        {exportState.status === 'error' && 'Migration Failed'}
                    </DialogTitle>
                    <DialogDescription>
                         {exportState.status === 'confirming' && `Migrate "${exportState.community?.name}" and all its data to the ${exportState.destination} Firestore database.`}
                         {(exportState.status === 'exporting' || exportState.status === 'success') && `Exporting "${exportState.community?.name}" to the ${exportState.destination} environment.`}
                         {exportState.status === 'error' && `Something went wrong while migrating "${exportState.community?.name}".`}
                    </DialogDescription>
                </DialogHeader>

                {exportState.status === 'confirming' && (
                    <div className="py-4 text-sm">
                        <p>This will perform the following actions:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                            <li>Register all {exportState.community?.memberCount} members in Firebase Authentication if they don't exist.</li>
                            <li>Copy community details, memberships, and messages to Firestore.</li>
                            <li>This action cannot be undone.</li>
                        </ul>
                    </div>
                )}
                
                {(exportState.status === 'exporting' || exportState.status === 'success') && (
                    <div className="py-4 space-y-4">
                        <Progress value={exportState.status === 'success' ? 100 : undefined} className="w-full" />
                        <div className="text-center text-sm text-muted-foreground">
                            <p className="font-semibold">{exportState.progress.step}</p>
                            <p>{exportState.progress.detail}</p>
                        </div>
                    </div>
                )}

                {exportState.status === 'error' && (
                    <div className="py-4 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                        <p className="font-semibold">Error Details:</p>
                        <p>{exportState.error}</p>
                    </div>
                )}
                
                <DialogFooter>
                    {exportState.status === 'confirming' && (
                        <>
                            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                            <Button onClick={handleExport}>
                                Confirm & Migrate
                            </Button>
                        </>
                    )}
                     {exportState.status === 'exporting' && (
                        <Button disabled>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Migrating...
                        </Button>
                    )}
                    {(exportState.status === 'success' || exportState.status === 'error') && (
                         <Button onClick={closeDialog}>Close</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
