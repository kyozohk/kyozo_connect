'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import LoginDialog from '@/components/landing/LoginDialog';

export default function LoginPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/analytics');
      } else {
        // If not logged in, show the login dialog
        setIsDialogOpen(true);
      }
    }
  }, [user, loading, router]);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    // Redirect to home if they close the dialog on the login page
    router.replace('/');
  }

  if (loading || user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <LoginDialog isOpen={isDialogOpen} onClose={handleCloseDialog} />;
}
