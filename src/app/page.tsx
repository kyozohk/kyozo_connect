'use client';

import Hero from '@/components/landing/Hero';
import FixedFooter from '@/components/landing/FixedFooter';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import FeatureCard from '@/components/landing/FeatureCard';
import ScrollRevealText from '@/components/landing/ScrollRevealText';
import { CustomDialog } from '@/components/ui/CustomDialog';
import { Login } from '@/components/auth/Login';

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [isLoginOpen, setLoginOpen] = useState(false);

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
      <Hero onGetStarted={() => setLoginOpen(true)} />
      <FeatureCard />
      <div className="my-80" style={{ paddingLeft: '10%', paddingRight: '10%' }}>
        <ScrollRevealText text="Where creative minds converge" />      
      </div>
      <FixedFooter onGetStarted={() => setLoginOpen(true)} />
      <CustomDialog
        isOpen={isLoginOpen}
        onClose={() => setLoginOpen(false)}
        title="Welcome to Kyozo"
        description="Create an account or sign in to access your community dashboard and settings."
        imageSrc="/images/kyozo-mushrooms.png"
      >
        <Login />
      </CustomDialog>
    </main>
  );
}
