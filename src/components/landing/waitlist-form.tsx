'use client';

import { useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2, Mail, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { waitlistSchema, type WaitlistInput } from '@/lib/types';
import { joinWaitlist } from '@/app/actions';
import { cn } from '@/lib/utils';

const interests = [
  { id: 'hip-hop', label: 'Hip-Hop' },
  { id: 'rock', label: 'Rock' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'tufting', label: 'Tufting' },
  { id: 'art', label: 'Arts' },
  { id: 'culture', label: 'Cultural Evolution' },
];

export function WaitlistForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [formSubmitted, setFormSubmitted] = useState(false);

  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);

  const form = useForm<WaitlistInput>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      type: 'member',
      interests: [],
    },
  });

  const onSubmit = (data: WaitlistInput) => {
    startTransition(async () => {
      const result = await joinWaitlist(data);
      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        setFormSubmitted(true);
      } else {
        toast({
          variant: 'destructive',
          title: 'Oops! Something went wrong.',
          description: result.message,
        });
      }
    });
  };

  if (formSubmitted) {
    return (
        <Card className="w-full max-w-lg mx-auto bg-card/80 backdrop-blur-sm border-0 shadow-2xl shadow-primary/20">
            <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                        <Check className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-headline font-bold mb-2">You're on the list!</h3>
                    <p className="text-muted-foreground">Thanks for joining the Kyozo waitlist. We'll be in touch soon.</p>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto bg-card/80 backdrop-blur-sm border-0 shadow-2xl shadow-primary/20">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl">Join the Waitlist</CardTitle>
        <CardDescription>Get early access to Kyozo.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="member" className="w-full" onValueChange={(value) => form.setValue('type', value as 'member' | 'owner')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="member">Kyozo</TabsTrigger>
            <TabsTrigger value="owner">Kyozo Pro</TabsTrigger>
          </TabsList>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={cn("relative input-container flex items-center", firstNameFocused && 'gradient-border', 'rounded-md')}>
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input id="firstName" {...form.register('firstName')} placeholder=" " className="pl-10 border-0" onFocus={() => setFirstNameFocused(true)} onBlur={() => setFirstNameFocused(false)} />
                <Label htmlFor="firstName" className="left-10">First Name</Label>
                {form.formState.errors.firstName && <p className="text-sm text-red-500 absolute -bottom-5">{form.formState.errors.firstName.message}</p>}
              </div>
              <div className={cn("relative input-container flex items-center", lastNameFocused && 'gradient-border', 'rounded-md')}>
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input id="lastName" {...form.register('lastName')} placeholder=" " className="pl-10 border-0" onFocus={() => setLastNameFocused(true)} onBlur={() => setLastNameFocused(false)} />
                <Label htmlFor="lastName" className="left-10">Last Name</Label>
                {form.formState.errors.lastName && <p className="text-sm text-red-500 absolute -bottom-5">{form.formState.errors.lastName.message}</p>}
              </div>
            </div>
            <div className={cn("relative input-container flex items-center", emailFocused && 'gradient-border', 'rounded-md')}>
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input id="email" type="email" {...form.register('email')} placeholder=" " className="pl-10 border-0" onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)} />
                <Label htmlFor="email" className="left-10">Your Email</Label>
                {form.formState.errors.email && <p className="text-sm text-red-500 absolute -bottom-5">{form.formState.errors.email.message}</p>}
            </div>
            <div className={cn("relative input-container flex items-center", phoneFocused && 'gradient-border', 'rounded-md')}>
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input id="phone" type="tel" {...form.register('phone')} placeholder=" " className="pl-10 border-0" onFocus={() => setPhoneFocused(true)} onBlur={() => setPhoneFocused(false)} />
                <Label htmlFor="phone" className="left-10">Phone Number (Optional)</Label>
            </div>
            <div className="space-y-3">
              <Label>What are your interests?</Label>
              <Controller
                name="interests"
                control={form.control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {interests.map((interest) => (
                      <div key={interest.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={interest.id}
                          checked={field.value?.includes(interest.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...(field.value || []), interest.id])
                              : field.onChange(
                                  field.value?.filter(
                                    (value) => value !== interest.id
                                  )
                                );
                          }}
                        />
                        <Label htmlFor={interest.id} className="font-normal cursor-pointer">{interest.label}</Label>
                      </div>
                    ))}
                  </div>
                )}
              />
              {form.formState.errors.interests && <p className="text-sm text-red-500">{form.formState.errors.interests.message}</p>}
            </div>
            <Button type="submit" className="w-full font-bold uppercase" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Join Waitlist
            </Button>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
