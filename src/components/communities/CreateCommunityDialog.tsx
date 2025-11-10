'use client';
import { useState } from 'react';
import { CustomDialog } from '@/components/ui/CustomDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CreateCommunityDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCommunityDialog: React.FC<CreateCommunityDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [communityName, setCommunityName] = useState('');
  const [communitySlug, setCommunitySlug] = useState('');

  const handleCreateCommunity = () => {
    // TODO: Implement community creation logic
    console.log('Creating community:', { communityName, communitySlug });
    onClose();
  };

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create a new community"
      description="Fill in the details below to create a new community."
      footerContent={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreateCommunity}>Create</Button>
        </>
      }
    >
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="name" className="text-right">
            Name
          </label>
          <Input
            id="name"
            value={communityName}
            onChange={(e) => setCommunityName(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="slug" className="text-right">
            Slug
          </label>
          <Input
            id="slug"
            value={communitySlug}
            onChange={(e) => setCommunitySlug(e.target.value)}
            className="col-span-3"
          />
        </div>
      </div>
    </CustomDialog>
  );
};
