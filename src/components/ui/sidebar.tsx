'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { VariantProps, cva } from 'class-variance-authority';
import { PanelLeft } from 'lucide-react';
import Link from 'next/link';

import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '4rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

type SidebarContext = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }
  return context;
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === 'function' ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }
        if (typeof window !== 'undefined') {
          document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
        }
      },
      [setOpenProp, open]
    );

    const toggleSidebar = React.useCallback(() => {
      return isMobile ? setOpenMobile(open => !open) : setOpen(open => !open);
    }, [isMobile, setOpen, setOpenMobile]);

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleSidebar]);

    const state = open ? 'expanded' : 'collapsed';

    const contextValue = React.useMemo(
      () => ({
        state: state as 'expanded' | 'collapsed',
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(
            'group/sidebar-wrapper relative flex h-full min-h-screen',
            className
          )}
          style={style}
          data-state={state}
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = 'SidebarProvider';

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    side?: 'left' | 'right';
    variant?: 'sidebar' | 'floating' | 'inset';
    collapsible?: 'offcanvas' | 'icon' | 'none';
  }
>(
  (
    {
      side = 'left',
      variant = 'sidebar',
      collapsible = 'offcanvas',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    if (collapsible === 'none') {
      return (
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      );
    }
    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent side={side} className="w-[18rem] p-0">
            {children}
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'transition-all', 
          state === 'expanded' ? 'w-[16rem]' : 'w-[4rem]', 
          state === 'expanded' ? '' : 'sidebar-collapsed',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'fixed h-full border-r bg-sidebar text-sidebar-foreground',
            side === 'right' && 'right-0 border-l',
            state === 'expanded' ? 'w-[16rem]' : 'w-[4rem]',
            'transition-all flex flex-col'
          )}
        >
          {children}
        </div>
      </div>
    );
  }
);
Sidebar.displayName = 'Sidebar';

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(
        'group-[[data-state=expanded]]/sidebar-wrapper:rotate-180',
        'shrink-0 transition-transform',
        className
      )}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
});
SidebarTrigger.displayName = 'SidebarTrigger';

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'main'>
>(({ className, ...props }, ref) => {
  const { isMobile, state } = useSidebar();
  return (
    <main
      ref={ref}
      className={cn(
        'flex-1 transition-all',
        !isMobile && (state === 'expanded' ? 'ml-[16rem]' : 'ml-[3.5rem]'),
        className
      )}
      {...props}
    />
  );
});
SidebarInset.displayName = 'SidebarInset';

const SidebarInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input> & { icon?: React.ReactNode }
>(({ icon, className, ...props }, ref) => {
  return (
    <div className="relative">
      {icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {icon}
        </div>
      )}
      <Input
        ref={ref}
        className={cn(icon && 'pl-9', 'h-9', className)}
        {...props}
      />
    </div>
  );
});
SidebarInput.displayName = 'SidebarInput';

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex h-16 shrink-0 items-center', className)}
      {...props}
    />
  );
});
SidebarHeader.displayName = 'SidebarHeader';

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('mt-auto flex shrink-0 flex-col sticky bottom-0 bg-sidebar', className)}
      {...props}
    />
  );
});
SidebarFooter.displayName = 'SidebarFooter';

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      className={cn(
        'h-px shrink-0 bg-sidebar-border',
        'group-[[data-state=collapsed]]/sidebar-wrapper:mx-2',
        className
      )}
      {...props}
    />
  );
});
SidebarSeparator.displayName = 'SidebarSeparator';

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full flex-1 flex-col overflow-y-auto',
        className
      )}
      {...props}
    />
  );
});
SidebarContent.displayName = 'SidebarContent';

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex flex-col gap-1', className)}
    {...props}
  />
));
SidebarMenu.displayName = 'SidebarMenu';

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('w-full', className)} {...props} />
));
SidebarMenuItem.displayName = 'SidebarMenuItem';

const sidebarMenuButtonVariants = cva(
  'peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-md py-2.5 px-3 text-left text-sm font-medium outline-none ring-sidebar-ring transition-colors focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 group-[[data-state=collapsed]]/sidebar-wrapper:justify-center group-[[data-state=collapsed]]/sidebar-wrapper:p-3 group-[[data-state=collapsed]]/sidebar-wrapper:h-10 group-[[data-state=collapsed]]/sidebar-wrapper:w-10 hover:bg-sidebar-hover',
  {
    variants: {
      isActive: {
        true: 'bg-sidebar-active',
        false: 'text-sidebar-foreground/80',
      },
      isSignOut: {
        true: 'group-[[data-state=collapsed]]/sidebar-wrapper:justify-start',
        false: 'group-[[data-state=collapsed]]/sidebar-wrapper:justify-center'
      }
    },
    defaultVariants: {
      isActive: false,
      isSignOut: false
    },
  }
);

type SidebarMenuButtonProps = 
  (React.ComponentProps<typeof Link> | React.ComponentProps<typeof Button>) & {
    isActive?: boolean;
    isSignOut?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
    icon?: React.ReactNode;
    badge?: React.ReactNode;
    href?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
  };

const SidebarMenuButton = React.forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  SidebarMenuButtonProps
>(
  (
    {
      isActive = false,
      isSignOut = false,
      tooltip,
      className,
      children,
      icon,
      badge,
      href,
      onClick,
      ...props
    },
    ref
  ) => {
    const { isMobile, state } = useSidebar();

    const content = (
      <>
        {icon &&
          React.cloneElement(icon as React.ReactElement, {
            className: cn(
              'h-4 w-4 shrink-0',
               isActive ? 'sidebar-icon-active' : 'text-sidebar-foreground/70 sidebar-icon-default',
               'group-[[data-state=collapsed]]/sidebar-wrapper:sidebar-collapsed-icon'
            ),
          })}
        <span
          className={cn(
            'group-[[data-state=collapsed]]/sidebar-wrapper:sr-only group-[[data-state=collapsed]]/sidebar-wrapper:w-0',
            'text-sidebar-foreground'
          )}
        >
          {children}
        </span>
        {badge && (
          <div className="ml-auto group-[[data-state=collapsed]]/sidebar-wrapper:sr-only group-[[data-state=collapsed]]/sidebar-wrapper:hidden">
            {badge}
          </div>
        )}
      </>
    );

    // Handle the sign out button specially to ensure it works correctly
    if (isSignOut && onClick) {
      return (
        <button
          className={cn(sidebarMenuButtonVariants({ isActive, isSignOut }), 'bg-transparent hover:bg-transparent', className)}
          onClick={onClick}
          type="button"
        >
          {content}
        </button>
      );
    }
    
    const button = (href && !onClick) ? (
      <Link
        ref={ref as React.ForwardedRef<HTMLAnchorElement>}
        href={href}
        className={cn(sidebarMenuButtonVariants({ isActive, isSignOut }), 'bg-transparent hover:bg-transparent', className)}
        {...((() => {
          const { href: _, ...rest } = props as any;
          return rest;
        })())}
      >
        {content}
      </Link>
    ) : (
      <Button
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        className={cn(sidebarMenuButtonVariants({ isActive, isSignOut }), 'bg-transparent hover:bg-transparent', className)}
        variant="ghost"
        onClick={onClick}
        type="button"
        {...(props as React.ComponentProps<typeof Button>)}
      >
        {content}
      </Button>
    );

    if (isMobile || (state === 'expanded' && !tooltip)) {
      return button;
    }

    if (!tooltip) {
      tooltip = {
        children: children,
      };
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent
            {...(typeof tooltip === 'string' ? {} : tooltip)}
            side="right"
          >
            {typeof tooltip === 'string' ? tooltip : tooltip.children}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);
SidebarMenuButton.displayName = 'SidebarMenuButton';

const SidebarUserProfile = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    icon?: React.ReactNode;
    email?: string | null;
    name?: string | null;
  }
>(({ className, icon, email, name, children, ...props }, ref) => {
  const { state } = useSidebar();
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-3 p-2',
        state === 'collapsed' && 'justify-center',
        className
      )}
      {...props}
    >
      {icon && (
        <div className="shrink-0 [&>svg]:size-5 [&_img]:size-8 [&_img]:rounded-full">
          {icon}
        </div>
      )}
      <div
        className={cn(
          'flex grow flex-col overflow-hidden group-[[data-state=collapsed]]/sidebar-wrapper:sr-only'
        )}
      >
        {name && (
          <p className="text-sm font-medium leading-tight text-sidebar-foreground truncate">
            {name}
          </p>
        )}
        {email && (
          <p className="text-xs text-sidebar-foreground/70 truncate">{email}</p>
        )}
      </div>
      <div className="group-[[data-state=collapsed]]/sidebar-wrapper:sr-only">
        {children}
      </div>
    </div>
  );
});
SidebarUserProfile.displayName = 'SidebarUserProfile';


export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  SidebarUserProfile,
  useSidebar,
};
