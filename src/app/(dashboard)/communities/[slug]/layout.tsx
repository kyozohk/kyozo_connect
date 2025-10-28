
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import { CommunityNav } from '@/components/communities/community-nav';
import { Community } from '@/types';
import { getFirestoreCommunities } from '@/app/fire/actions';
import { LayoutDashboard, Users, Send } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

export default function CommunitySlugLayout({ children }: { children: React.ReactNode }) {
  const { setOpen } = useSidebar();
  const pathname = usePathname();
  const params = useParams();
  const slug = params.slug as string;

  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    // Keep sidebar collapsed on community pages
    setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    async function fetchCommunities() {
        const allCommunities = await getFirestoreCommunities();
        setCommunities(allCommunities);
    }
    fetchCommunities();
  }, []);

  const navItems = [
    { href: `/communities/${slug}`, icon: LayoutDashboard, label: 'Overview' },
    { href: `/communities/${slug}/members`, icon: Users, label: 'Members' },
    { href: `/communities/${slug}/broadcast`, icon: Send, label: 'Broadcast' },
  ];

  return (
      <div className="flex h-full">
        <Sidebar side="left" collapsible="none" className="w-64 border-r md:flex hidden">
            <SidebarHeader className="p-0">
            <CommunityNav communities={communities} currentCommunityId={slug} />
            </SidebarHeader>
            <SidebarContent>
            <SidebarMenu>
                {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                    <SidebarMenuButton as="a" isActive={pathname === item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                ))}
            </SidebarMenu>
            </SidebarContent>
        </Sidebar>
        <main className="flex-1 overflow-y-auto">
            {children}
        </main>
      </div>
  );
}
