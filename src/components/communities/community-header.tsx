
import { Community } from "@/types";
import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LayoutGrid, Users, MapPin, Globe, Edit, UserPlus, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CommunityHeaderProps {
    community: Community;
}

export function CommunityHeader({ community }: CommunityHeaderProps) {
    const data = community.data as any;

    return (
        <div className="relative">
            <div className="relative h-48 w-full">
                {data.communityBackgroundImage ? (
                    <Image
                        src={data.communityBackgroundImage}
                        alt={`${community.name} background`}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-r from-blue-500 to-indigo-600" />
                )}
                <div className="absolute inset-0 bg-black/30" />
            </div>

            <div className="relative px-8 -mt-16">
                <div className="flex items-end gap-6">
                    <Avatar className="h-32 w-32 border-4 border-background">
                        <AvatarImage src={community.communityProfileImage} alt={community.name} />
                        <AvatarFallback><LayoutGrid className="h-16 w-16" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-grow pb-2">
                        <h1 className="text-4xl font-bold text-white shadow-md">{community.name}</h1>
                        <p className="text-lg text-gray-200 mt-1 shadow-sm">{data.tagline}</p>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                     {data.communityPrivacy && (
                        <Badge variant="outline" className="border-gray-400 text-gray-300">
                           <Globe className="h-3 w-3 mr-1.5"/> 
                           {data.communityPrivacy === 'open' ? 'Public' : 'Private'} Community
                        </Badge>
                     )}
                     <div className="flex items-center gap-1.5 text-sm text-gray-300">
                        <Users className="h-4 w-4" />
                        <span>{community.memberCount} members</span>
                     </div>
                     {data.location && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-300">
                            <MapPin className="h-4 w-4" />
                            <span>{data.location}</span>
                        </div>
                     )}
                     {data.tags && data.tags.length > 0 && (
                        <Badge variant="secondary">{data.tags[0]}</Badge>
                     )}
                </div>

                 <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-2" /> Edit Profile</Button>
                    <Button variant="outline" size="sm"><UserPlus className="h-4 w-4 mr-2" /> Add Members</Button>
                    <Button variant="outline" size="sm"><Send className="h-4 w-4 mr-2" /> Invite</Button>
                     <Button variant="outline" size="sm"><Send className="h-4 w-4 mr-2" /> Broadcast</Button>
                </div>

                {data.colorPalette && (
                    <div className="mt-4">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-muted-foreground">Color Palette:</p>
                            <div className="flex gap-2">
                            {(data.colorPalette as any[]).map((color, index) => (
                                <div key={index} className="h-6 w-6 rounded-full border" style={{ backgroundColor: color.hexCode }} title={color.hexCode} />
                            ))}
                            </div>
                        </div>
                    </div>
                )}
                
            </div>
             <Separator className="mt-8" />
        </div>
    );
}
