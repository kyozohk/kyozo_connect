
'use client';
import { Member } from '@/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Edit, Trash2, Phone, CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Checkbox } from '../ui/checkbox';

type ViewMode = 'grid' | 'list';
type SelectionMode = 'none' | 'single' | 'multiple';

interface MemberCardProps {
    member: Member;
    viewMode: ViewMode;
    selectionMode?: SelectionMode;
    isSelected?: boolean;
    onSelect?: (memberId: string) => void;
}

export function MemberCard({ member, viewMode, selectionMode = 'none', isSelected, onSelect }: MemberCardProps) {
    const joinedAt = member.joinedAt ? format(parseISO(member.joinedAt), "MMM d, yyyy") : 'N/A';
    const fallback = member.displayName ? member.displayName.charAt(0).toUpperCase() : '?';

    const ActionButtons = () => (
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon"><MessageSquare className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
    );

    const handleCardClick = () => {
        if (onSelect) {
            onSelect(member.id);
        }
    }

    if (viewMode === 'list') {
        return (
            <Card onClick={handleCardClick} className="flex items-center p-2 pr-4 hover:shadow-md transition-shadow cursor-pointer">
                {selectionMode !== 'none' && (
                    <div className="p-2">
                        <Checkbox 
                            checked={isSelected} 
                            onCheckedChange={() => onSelect && onSelect(member.id)} 
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select ${member.displayName}`}
                        />
                    </div>
                )}
                <Avatar className="h-10 w-10 mx-2">
                    <AvatarImage src={member.photoURL} alt={member.displayName} />
                    <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
                <div className="flex-grow grid grid-cols-5 items-center gap-4">
                    <div className="col-span-2">
                        <p className="font-semibold">{member.displayName}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <div>
                        <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="capitalize">{member.role}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{member.phoneNumber}</div>
                    <div className="text-sm text-muted-foreground">{joinedAt}</div>
                </div>
                 {selectionMode === 'none' && <ActionButtons />}
            </Card>
        );
    }

    return (
        <Card onClick={handleCardClick} className="flex flex-col h-full hover:shadow-md transition-shadow cursor-pointer">
            {selectionMode !== 'none' && (
                <div className="absolute top-2 right-2 z-10">
                    <Checkbox checked={isSelected} onCheckedChange={() => onSelect && onSelect(member.id)} />
                </div>
            )}
            <CardHeader className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-2">
                    <AvatarImage src={member.photoURL} alt={member.displayName} />
                    <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">{member.displayName}</h3>
                <p className="text-sm text-muted-foreground">{member.email}</p>
                <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="capitalize mt-2">{member.role}</Badge>
            </CardHeader>
            <CardContent className="flex-grow text-center">
                <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{member.phoneNumber || 'No phone'}</span>
                </div>
                <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground mt-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Joined {joinedAt}</span>
                </div>
                {selectionMode === 'none' && <div className="mt-4"> <ActionButtons /> </div>}
            </CardContent>
        </Card>
    );
}
