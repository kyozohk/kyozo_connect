'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, BarChart3, DatabaseZap, Users, CreditCard, Settings, LogOut, LayoutGrid, Inbox } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { setOpen, toggleSidebar } = useSidebar();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
      if (pathname.startsWith('/communities/')) {
        setOpen(false);
      } else if (pathname.startsWith('/communities')) {
        setOpen(true);
      }
  }, [pathname, setOpen]);


  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const fallback = user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email!.charAt(0).toUpperCase();

  const navItems = [
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/communities', icon: LayoutGrid, label: 'Communities' },
    { href: '/inbox', icon: Inbox, label: 'Inbox' },
    { href: '/migrate', icon: DatabaseZap, label: 'Migrate' },
    { href: '/firebase', icon: Users, label: 'Firebase Data' },
    { href: '/subscription', icon: CreditCard, label: 'Subscription' },
    { href: '/settings', icon: Settings, label: 'Settings' },
    { href: '/team', icon: Users, label: 'Team' },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden">
       <Sidebar>
        <SidebarHeader>
            <Button variant="ghost" className="h-auto p-0 w-full justify-start" onClick={toggleSidebar}>
                {/* Expanded Logo */}
                <Image src="/logo.png" alt="Kyozo Logo" width={144} height={41} className="group-data-[collapsible=icon]:hidden" />
                {/* Collapsed Icon */}
                <Image src="/favicon.png" alt="Kyozo Icon" width={41} height={41} className="hidden group-data-[collapsible=icon]:block" />
            </Button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
               <SidebarMenuItem key={item.href}>
                 <Link href={item.href} passHref>
                    <SidebarMenuButton as="a" isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                      <item.icon />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
               </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
             <div className="flex flex-col gap-2 p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:items-center">
                <div className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:p-0">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                        <AvatarFallback>{fallback}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-medium leading-none">{user.displayName || user.email}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                </div>
                 <SidebarMenu className="group-data-[collapsible=icon]:p-0">
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={handleLogout} tooltip="Log Out">
                          <LogOut />
                          <span className="group-data-[collapsible=icon]:hidden">Log Out</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </div>
  );
}
