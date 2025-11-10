'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';


interface FixedFooterProps {
  className?: string;
  onGetStarted: () => void;
}

const FixedFooter: React.FC<FixedFooterProps> = ({ className = '', onGetStarted }) => {
  const { user, loading, auth } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (user && (pathname === '/' || pathname === '/login')) {
      router.replace('/analytics');
    }
  }, [user, router, pathname]);

  const handleLogout = async () => {
    if (!auth) return;
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isDashboardPage = pathname?.startsWith('/analytics') || 
                           pathname?.startsWith('/communities') || 
                           pathname?.startsWith('/inbox') || 
                           pathname?.startsWith('/migrate') || 
                           pathname?.startsWith('/firebase') || 
                           pathname?.startsWith('/settings') || 
                           pathname?.startsWith('/subscription') || 
                           pathname?.startsWith('/team');

  if (isDashboardPage || loading) {
    return null;
  }


  return (
    <>
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
                style={{ backgroundColor: 'var(--accent-pink)'}}
                size="sm"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? <Loader2 className="animate-spin" /> : 'Sign Out'}
              </Button>
            ) : (
              <Button
                onClick={onGetStarted}
                className="joinButton"
                style={{ backgroundColor: 'var(--accent-pink)'}}
                size="sm"
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </footer>
    </>
  );
};

export default FixedFooter;
