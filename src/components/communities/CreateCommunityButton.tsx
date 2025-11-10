'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateCommunityDialog } from './CreateCommunityDialog';

export const CreateCommunityButton = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>Create Community</Button>
      <CreateCommunityDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
};
