'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Community name must be at least 3 characters.' }).max(50),
  slug: z.string().min(3, { message: 'Slug must be at least 3 characters.' })
    .max(50)
    .regex(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens.' }),
  description: z.string().max(500).optional(),
});

interface CreateCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateCommunityDialog({ open, onOpenChange }: CreateCommunityDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to create a community.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      if (!firestore) {
        throw new Error('Firestore is not initialized');
      }
      
      // Create a new community document
      const communityRef = doc(collection(firestore, 'communities'), values.slug);
      
      await setDoc(communityRef, {
        name: values.name,
        slug: values.slug,
        description: values.description || '',
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        members: [user.uid],
        admins: [user.uid],
        isPublic: true,
      });

      // Add the user as a member of the community
      const memberRef = doc(collection(firestore, 'communities', values.slug, 'members'), user.uid);
      await setDoc(memberRef, {
        userId: user.uid,
        role: 'admin',
        joinedAt: serverTimestamp(),
      });

      toast({
        title: 'Community created',
        description: `${values.name} has been created successfully.`,
      });

      // Reset form and close dialog
      form.reset();
      onOpenChange(false);

      // Navigate to the new community
      router.push(`/communities/${values.slug}`);
    } catch (error: any) {
      console.error('Error creating community:', error);
      toast({
        title: 'Failed to create community',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create a new community</DialogTitle>
          <DialogDescription>
            Create a space for your audience, team, or interest group.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Community Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="My Awesome Community" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        // Auto-generate slug from name if slug is empty
                        if (!form.getValues('slug')) {
                          form.setValue('slug', generateSlug(e.target.value));
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Slug</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-1">kyozoconnect.com/communities/</span>
                      <Input placeholder="my-community" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell people what your community is about..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Community
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
