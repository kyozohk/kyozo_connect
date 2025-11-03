'use client';

import { Community, Member } from '@/types';
import { MemberListClient } from './member-list-client';

interface MemberListProps {
  community: Community;
  initialMembers: Member[];
}

export function MemberList({ community, initialMembers }: MemberListProps) {
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Total Members: {initialMembers.length}</h3>
            <p className="text-sm text-muted-foreground">
              Manage members for {community.name}
            </p>
          </div>
        </div>
      </div>
      
      <MemberListClient 
        initialMembers={initialMembers} 
        selectionMode="multiple"
      />
    </div>
  );
}
