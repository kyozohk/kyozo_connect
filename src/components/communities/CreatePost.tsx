'use client';
import { useState } from 'react';
import { CustomDialog } from '@/components/ui/CustomDialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface CreatePostProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(true);

  const handleCreatePost = () => {
    // TODO: Implement post creation logic
    console.log('Creating post:', { title, description, image, isPublic });
    onClose();
  };

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create a new post"
      description="Fill in the details below to create a new post."
      footerContent={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreatePost}>Create</Button>
        </>
      }
    >
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="title" className="text-right">
            Title
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="description" className="text-right">
            Description
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="image" className="text-right">
            Image
          </label>
          <Input
            id="image"
            type="file"
            onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <label className="text-right">Visibility</label>
          <RadioGroup
            defaultValue="public"
            className="col-span-3 flex items-center space-x-4"
            onValueChange={(value) => setIsPublic(value === 'public')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="public" id="public" />
              <Label htmlFor="public">Public</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="private" id="private" />
              <Label htmlFor="private">Private</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </CustomDialog>
  );
};
