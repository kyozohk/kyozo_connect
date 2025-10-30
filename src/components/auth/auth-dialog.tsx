'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { GoogleIcon } from './google-icon';
import SignUpForm from './sign-up-form';
import SignInForm from './sign-in-form';
import { useUser } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider, getAuth } from 'firebase/auth';
import { X } from 'lucide-react';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [isSigningIn, setIsSigningIn] = useState(true);
  const router = useRouter();
  const { user } = useUser();
  
  // Redirect to dashboard if user is logged in
  useEffect(() => {
    if (user) {
      onOpenChange(false);
      router.push('/analytics');
    }
  }, [user, router, onOpenChange]);

  const onSignInSuccess = () => {
    onOpenChange(false);
    router.push('/analytics');
  };

  const handleGoogleClick = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onSignInSuccess();
    } catch (error) {
      console.error("Google sign in failed", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 w-[calc(100vw-12rem)] h-[calc(100vh-12rem)] max-h-[calc(100vh-2rem)] max-w-[100vw] bg-card overflow-hidden rounded-lg" hideCloseButton>
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute right-6 top-6 z-50 rounded-full bg-black/40 p-3 text-white hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-md"
        >
          <X className="h-6 w-6" />
          <span className="sr-only">Close</span>
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 h-full">
          <div className="p-12 flex flex-col overflow-y-auto">
            <h2 className="text-3xl font-bold font-headline">
              {isSigningIn ? 'Welcome back' : 'Welcome to Kyozo'}
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              {isSigningIn
                ? 'Sign in to access your community dashboard.'
                : 'Create an account or sign in to access your community dashboard and settings.'}
            </p>

            <div className="flex-1 flex flex-col justify-center py-12">
                {isSigningIn ? <SignInForm /> : <SignUpForm />}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">OR</span>
                  <Separator className="flex-1" />
              </div>
              <Button variant="outline" className="w-full h-14 text-base border-gray-700 hover:bg-gray-800" onClick={handleGoogleClick}>
                <GoogleIcon className="mr-2" />
                Continue with Google
              </Button>
            </div>

            <p className="text-base text-muted-foreground mt-8 text-center">
              {isSigningIn
                ? "Don't have an account? "
                : 'Already have an account? '}
              <button
                onClick={() => setIsSigningIn(!isSigningIn)}
                className="text-primary font-semibold hover:underline text-base"
              >
                {isSigningIn ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
          <div className="hidden md:block relative h-full">
            <video
              src="/form-right.mp4"
              autoPlay
              muted
              loop
              className="absolute inset-0 w-full h-full object-cover rounded-r-lg"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
