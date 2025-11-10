'use client';
import { useState, useTransition } from 'react';
import { CustomDialog } from '@/components/ui/CustomDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createCommunity } from '@/app/actions/createCommunity';
import { Loader2 } from 'lucide-react';

interface CreateCommunityDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCommunityDialog: React.FC<CreateCommunityDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('The Adventurers Guild');
  const [slug, setSlug] = useState('adventurers-guild');
  const [tagline, setTagline] = useState('Your next great adventure starts here.');
  const [lore, setLore] = useState('A community for adventurers of all kinds to share stories, plan expeditions, and team up for epic quests.');
  const [mantras, setMantras] = useState('Explore, Discover, Conquer');
  const [communityPrivacy, setCommunityPrivacy] = useState('private');
  const [communityType, setCommunityType] = useState('community');
  const [tags, setTags] = useState('adventure, quests, community');
  const [error, setError] = useState<string | null>(null);

  const handleCreateCommunity = () => {
    startTransition(async () => {
      const communityData = {
        name,
        slug,
        tagline,
        lore,
        mantras,
        communityPrivacy,
        communityType,
        tags: tags.split(',').map(tag => tag.trim()),
        status: 'draft',
        visibility: true,
        isDeleted: false,
      };

      const result = await createCommunity(communityData);

      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  };

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create a new community"
      description="Fill in the details below to create a new community."
      footerContent={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleCreateCommunity} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : 'Create'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 py-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {error && <p className="text-red-500 col-span-4">{error}</p>}
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="name" className="text-right">Name</label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="slug" className="text-right">Slug</label>
          <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="tagline" className="text-right">Tagline</label>
          <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <label htmlFor="lore" className="text-right pt-2">Lore</label>
          <Textarea id="lore" value={lore} onChange={(e) => setLore(e.target.value)} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="mantras" className="text-right">Mantras</label>
          <Input id="mantras" value={mantras} onChange={(e) => setMantras(e.target.value)} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="tags" className="text-right">Tags</label>
          <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} className="col-span-3" placeholder="e.g., Design, Tech, Art" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="privacy" className="text-right">Privacy</label>
            <Select value={communityPrivacy} onValueChange={setCommunityPrivacy}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select privacy" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="invite-only">Invite-Only</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="type" className="text-right">Type</label>
            <Select value={communityType} onValuechange={setCommunityType}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>
    </CustomDialog>
  );
};
