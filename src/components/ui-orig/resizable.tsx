"use client"

import * as React from "react"
import { GripVertical } from "lucide-react"
import { Resizable } from "re-resizable"
import type { ResizableProps } from "re-resizable"
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type PanelGroupProps,
  type PanelProps,
} from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}: PanelGroupProps) => (
  <PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof PanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <PanelResizeHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </PanelResizeHandle>
)

const ResizableBox = React.forwardRef<
  React.ElementRef<typeof Resizable>,
  ResizableProps
>(({ className, ...props }, ref) => (
  <Resizable
    ref={ref}
    className={cn("relative", className)}
    handleClasses={{
      right:
        "absolute right-0 top-0 h-full w-2 cursor-col-resize bg-border/50 hover:bg-border transition-colors",
      left: "absolute left-0 top-0 h-full w-2 cursor-col-resize bg-border/50 hover:bg-border transition-colors",
      top: "absolute left-0 top-0 h-2 w-full cursor-row-resize bg-border/50 hover:bg-border transition-colors",
      bottom:
        "absolute bottom-0 left-0 h-2 w-full cursor-row-resize bg-border/50 hover:bg-border transition-colors",
    }}
    {...props}
  />
))
ResizableBox.displayName = "ResizableBox"

export { ResizablePanelGroup, ResizablePanel, ResizableHandle, ResizableBox }
