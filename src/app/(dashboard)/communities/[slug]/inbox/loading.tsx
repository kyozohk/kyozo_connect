import { Skeleton } from "@/components/ui/skeleton";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

export default function CommunityInboxLoading() {
  return (
    <ResizablePanelGroup direction="horizontal" className="h-full w-full">
      <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
        <div className="flex h-full flex-col border-l bg-card">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold tracking-tight mb-2">Members</h2>
                <Skeleton className="h-9 w-full" />
            </div>
            <div className="flex-1 p-2 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-2 p-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="w-[150px] space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                    </div>
                </div>
                ))}
            </div>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={70} minSize={30}>
        <div className="flex h-full flex-col bg-card">
            <div className="flex items-center justify-between border-b p-4">
                <div className="flex-1 space-y-1">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-9 w-32" />
            </div>
            <div className="p-4 border-b">
                <Skeleton className="h-9 w-full" />
            </div>
             <div className="flex-1 p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-64" />
                    </div>
                    </div>
                ))}
            </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
