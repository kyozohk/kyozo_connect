'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import { CommunityNav } from '@/components/communities/community-nav';
import { Community, Member } from '@/types';
import { getFirestoreCommunities, getFirestoreMembers } from '@/app/fire/actions';
import { LayoutDashboard, Users, Send } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';

export default function CommunitySlugLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { setOpen } = useSidebar();
  const pathname = usePathname();
  const params = useParams();
  const slug = params.slug as string;

  const [communities, setCommunities] = useState<Community[]>([]);
  const [currentCommunity, setCurrentCommunity] = useState<Community | null>(null);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | null>(null);

  useEffect(() => {
    // Keep sidebar collapsed on community pages
    setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    async function fetchData() {
        if (user) {
            // A real implementation might fetch only user's communities
            const allCommunities = await getFirestoreCommunities();
            setCommunities(allCommunities);

            const foundCommunity = allCommunities.find(c => c.id === slug);
            if (foundCommunity) {
                setCurrentCommunity(foundCommunity);
                const members = await getFirestoreMembers(foundCommunity.id);
                const currentUserMembership = members.find(m => m.uid === user.uid);
                if (currentUserMembership) {
                    setUserRole(currentUserMembership.role);
                }
            }
        }
    }
    fetchData();
  }, [slug, user]);

  const navItems = [
    { href: `/dashboard/communities/${slug}`, icon: LayoutDashboard, label: 'Overview' },
    { href: `/dashboard/communities/${slug}/members`, icon: Users, label: 'Members' },
    { href: `/dashboard/communities/${slug}/broadcast`, icon: Send, label: 'Broadcast' },
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
