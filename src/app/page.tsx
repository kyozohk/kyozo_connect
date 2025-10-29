'use client';

import Hero from '@/components/landing/Hero';
import FixedFooter from '@/components/landing/FixedFooter';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/analytics');
    }
  }, [user, loading, router]);

  if (loading) {
     return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (user) {
    return null; // Redirecting...
  }

  return (
    <main>
      <Hero />
      <FixedFooter />
    </main>
  );
}
