
'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Loader2, MessageSquare, Edit, Trash2, Phone, CalendarIcon } from 'lucide-react';
import { Member } from '@/types';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MemberCard } from './member-card';
import { Checkbox } from '../ui/checkbox';

type ViewMode = 'grid' | 'list';
type SortKey = 'displayName' | 'joinedAt' | 'role';
type SelectionMode = 'none' | 'single' | 'multiple';

interface MemberListClientProps {
    initialMembers: Member[];
    selectionMode?: SelectionMode;
    onSelectMember?: (member: Member | null) => void;
}

export function MemberListClient({ initialMembers, selectionMode = 'none', onSelectMember }: MemberListClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('displayName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  const handleSelectMember = (memberId: string) => {
    setSelectedMembers(prev => {
        const newSelection = new Set(prev);
        const wasSelected = newSelection.has(memberId);
        
        if (wasSelected) {
            newSelection.delete(memberId);
        } else {
            if (selectionMode === 'single') {
                newSelection.clear();
            }
            newSelection.add(memberId);
        }
        
        // Schedule the onSelectMember call after the state update
        setTimeout(() => {
            if (onSelectMember) {
                if (wasSelected) {
                    onSelectMember(null);
                } else {
                    const selectedMember = members.find(m => m.id === memberId);
                    if (selectedMember) {
                        onSelectMember(selectedMember);
                    }
                }
            }
        }, 0);
        
        return newSelection;
    });
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        // Ensure we're using string IDs
        setSelectedMembers(new Set(members.map(m => m.id.toString())));
        
        // If in single selection mode and we have onSelectMember, select the first member
        if (selectionMode === 'single' && onSelectMember && members.length > 0) {
            // Schedule after state update
            setTimeout(() => {
                onSelectMember(members[0]);
            }, 0);
        }
    } else {
        setSelectedMembers(new Set());
        
        // Clear selection if we have onSelectMember
        if (onSelectMember) {
            // Schedule after state update
            setTimeout(() => {
                onSelectMember(null);
            }, 0);
        }
    }
  }
  
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
        // Handle joinedAt separately since it needs special date comparison
        if(sortKey === 'joinedAt') {
            const timeA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
            const timeB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
            return sortDir === 'asc' ? timeA - timeB : timeB - timeA;
        }
        
        // For other fields, do string comparison
        const compareA = String(a[sortKey] || '');
        const compareB = String(b[sortKey] || '');

        if (compareA < compareB) return sortDir === 'asc' ? -1 : 1;
        if (compareA > compareB) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });
  }, [members, sortKey, sortDir]);

  const filteredMembers = useMemo(() => {
    if (!searchTerm) return sortedMembers;
    return sortedMembers.filter(member => 
        member.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phoneNumber?.includes(searchTerm) ||
        (member.data?.tags as string[])?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [sortedMembers, searchTerm]);
  
  // Handle initial selection if needed
  // We use a ref to track if we've already called onSelectMember
  const hasCalledSelectMember = useRef(false);
  
  useEffect(() => {
    // If we're in single selection mode and have a selected member but onSelectMember hasn't been called yet
    if (!hasCalledSelectMember.current && selectionMode === 'single' && selectedMembers.size === 1 && onSelectMember) {
      const selectedMemberId = Array.from(selectedMembers)[0];
      const selectedMember = members.find(m => m.id === selectedMemberId);
      if (selectedMember) {
        // Use setTimeout to avoid calling during render
        setTimeout(() => {
          onSelectMember(selectedMember);
          hasCalledSelectMember.current = true;
        }, 0);
      }
    }
  }, [selectionMode, selectedMembers, members, onSelectMember]); // Include all dependencies
  
  const isAllSelected = selectedMembers.size > 0 && selectedMembers.size === filteredMembers.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex-grow">
          <Input
            placeholder="Search members or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
           <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="displayName">Name</SelectItem>
                        <SelectItem value="joinedAt">Join Date</SelectItem>
                        <SelectItem value="role">Role</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}>
                <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}>
                <LayoutGrid className="h-4 w-4" />
            </Button>
        </div>
      </div>

       {selectionMode === 'multiple' && (
         <div className="flex items-center px-4 py-2 border-b">
            <Checkbox 
                id="select-all" 
                onCheckedChange={handleSelectAll}
                checked={isAllSelected}
            />
            <label htmlFor="select-all" className="ml-3 text-sm font-medium">
                Select All
            </label>
        </div>
       )}

      {filteredMembers.length > 0 ? (
         <div className={`grid gap-4 mt-4 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredMembers.map((member) => (
                <MemberCard 
                    key={member.id} 
                    member={member} 
                    viewMode={viewMode}
                    selectionMode={selectionMode}
                    isSelected={selectedMembers.has(member.id)}
                    onSelect={handleSelectMember}
                />
            ))}
        </div>
      ) : (
         <div className="text-center text-muted-foreground py-16">
            <p>No members found.</p>
        </div>
      )}
    </div>
  );
}
