'use client';

import Hero from '@/components/landing/Hero';
import FixedFooter from '@/components/landing/FixedFooter';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import FeatureCard from '@/components/landing/FeatureCard';
import ScrollRevealText from '@/components/landing/ScrollRevealText';

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/analytics');
      } else {
        router.replace('/landing');
      }
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
      <FeatureCard />
      <div className="my-80 bg-white" style={{ paddingLeft: '10%', paddingRight: '10%' }}>
        <ScrollRevealText text="Where creative minds converge" />      
      </div>
      <FixedFooter />
    </main>
  );
}
