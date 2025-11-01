'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getAdminDb } from '@/lib/firebase-admin';

/**
 * This component is shown to users who have been migrated from MongoDB
 * and need to set up their password for the first time.
 */
export function MigratedUserWelcome() {
  const { user, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if the user needs to set up their password
    async function checkPasswordStatus() {
      if (!user) return;
      
      try {
        const db = await getAdminDb();
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists && userDoc.data()?.needsPasswordReset) {
          setNeedsPasswordReset(true);
        }
      } catch (error) {
        console.error('Error checking password status:', error);
      }
    }
    
    if (!loading && user) {
      checkPasswordStatus();
    }
  }, [user, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive',
      });
      return;
    }
    
    if (password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Your password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Update the user's password
      await user?.updatePassword(password);
      
      // Update the user's profile to indicate they've set their password
      const db = await getAdminDb();
      await db.collection('users').doc(user!.uid).update({
        needsPasswordReset: false,
        passwordInitialized: true,
        passwordSetAt: new Date(),
      });
      
      // Also update any memberships
      const memberships = await db.collection('memberships')
        .where('userId', '==', user!.uid)
        .get();
      
      const batch = db.batch();
      memberships.forEach(doc => {
        batch.update(doc.ref, {
          needsPasswordReset: false,
          passwordInitialized: true,
        });
      });
      
      await batch.commit();
      
      toast({
        title: 'Password set successfully',
        description: 'Your password has been set up. You can now use it to log in.',
      });
      
      setNeedsPasswordReset(false);
    } catch (error: any) {
      console.error('Error setting password:', error);
      toast({
        title: 'Error setting password',
        description: error.message || 'An error occurred while setting your password.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user || !needsPasswordReset) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome to Kyozo Connect</CardTitle>
        <CardDescription>
          Your account has been migrated from our previous system.
          Please set up a password to continue.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Setting up...' : 'Set Password'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
