'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import SimpleAuthDialog from './SimpleAuthDialog';
import { useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';


interface FixedFooterProps {
  className?: string;
}

const FixedFooter: React.FC<FixedFooterProps> = ({ className = '' }) => {
  const { user, loading, auth } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Auto-redirect authenticated users to dashboard
  useEffect(() => {
    if (user && (pathname === '/' || pathname === '/login')) {
      router.replace('/analytics');
    }
  }, [user, router, pathname]);

  const openDialog = () => {
    if (!user) {
      setIsDialogOpen(true);
    } else {
      router.push('/analytics');
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  const handleLogout = async () => {
    if (!auth) return;
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      // Let the main page handle the redirect, or explicitly redirect
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Don't render footer on dashboard pages
  if (pathname?.startsWith('/analytics') || pathname?.startsWith('/communities') || pathname?.startsWith('/inbox') || pathname?.startsWith('/migrate') || pathname?.startsWith('/firebase') || pathname?.startsWith('/settings') || pathname?.startsWith('/subscription') || pathname?.startsWith('/team') ) {
    return null;
  }
  
  if (loading) {
    return null; // Don't show footer while checking auth state
  }


  return (
    <footer className={`fixedFooter ${className}`}>
      <div className="footer-container">
        <div className="logoButtonContainer">
          <Image 
            src="/logo.png" 
            alt="Kyozo Logo" 
            width={100} 
            height={30} 
            className="buttonLogo"
          />
          {user ? (
            <Button
              onClick={handleLogout}
              className="joinButton"
              size="sm"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? <Loader2 className="animate-spin" /> : 'Sign Out'}
            </Button>
          ) : (
            <Button
              onClick={openDialog}
              className="joinButton"
              size="sm"
            >
              Get Started
            </Button>
          )}
        </div>
      </div>
      
      <SimpleAuthDialog 
        isOpen={isDialogOpen} 
        onClose={closeDialog}
      />
    </footer>
  );
};

export default FixedFooter;
