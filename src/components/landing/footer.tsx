'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import styles from './FixedFooter.module.css';
import AuthDialog from '@/components/auth/auth-dialog';
import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut } from 'lucide-react';

interface FixedFooterProps {
  className?: string;
}

const FixedFooter: React.FC<FixedFooterProps> = ({ className = '' }) => {
  const { user } = useUser();
  
  const signOut = async () => {
    // Use Firebase signOut
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    await auth.signOut();
    router.push('/landing');
  };
  const router = useRouter();
  const pathname = usePathname();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Auto-redirect authenticated users to dashboard from home page
  useEffect(() => {
    if (user && pathname === '/') {
      router.push('/landing');
    }
  }, [user, router, pathname]);
  
  // Hide footer on dashboard pages
  const isDashboardPage = pathname.includes('/dashboard') || 
                         pathname.includes('/communities') || 
                         pathname.includes('/moderation') || 
                         pathname.includes('/migrate');
  
  if (isDashboardPage) {
    return null;
  }

  const openDialog = () => {
    if (!user) {
      setIsDialogOpen(true);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <>
      <footer className={`${styles.fixedFooter} ${className}`}>
        <div className={styles.container}>
          <div className={styles.logoButtonContainer}>
             <Link href="/landing" className={styles.buttonLogo}>
                <Image 
                src="/logo.png" 
                alt="Kyozo Logo" 
                width={100} 
                height={30} 
                />
             </Link>
            {user ? (
                <div className={styles.buttonGroup}>
                  <Button 
                      variant="default" 
                      onClick={() => router.push('/dashboard')}
                      className={styles.dashboardButton}
                      size="sm"
                  >
                      Dashboard
                  </Button>
                  <Button
                      variant="outline"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Sign out clicked from footer');
                        await signOut();
                      }}
                      className={styles.signOutButton}
                      size="sm"
                  >
                      <LogOut className={styles.signOutIcon} />
                      <span className={styles.signOutText}>Sign Out</span>
                  </Button>
                </div>
            ) : (
              <Button 
                variant="default" 
                onClick={openDialog}
                className={styles.joinButton}
                size="sm"
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </footer>
      
      <AuthDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
};

export default FixedFooter;
