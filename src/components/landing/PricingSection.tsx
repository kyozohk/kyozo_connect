'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import PricingCard from '@/components/ui/pricing-card';
import styles from './PricingSection.module.css';
import { Button } from "@/components/ui/button";

const pricingData: PricingCardData[] = [
  {
    title: 'Kyozo',
    subtitle: 'Community Connection',
    price: 'FREE',
    priceDescription: 'membership',
    features: [
      'Creative Labs content',
      'Connect with like-minded creatives',
      'Explore exclusive content',
      'Discover communities',
      'Early adopter benefits',
    ],
    gradient: 'from-purple-500 to-pink-500',
    subtitleColor: 'purple-400',
  },
  {
    title: 'KyozoPro',
    subtitle: 'Community Growth',
    price: 'PREMIUM',
    priceDescription: 'subscription',
    features: [
      'Creative Labs content',
      'Build and manage your communities',
      'Advanced community app',
      'Audience dashboards',
      'Custom group messaging',
      'Enhanced CRM toolkit',
    ],
    gradient: 'from-blue-500 to-cyan-500',
    subtitleColor: 'blue-400',
  },
];

const PriceCircles = dynamic(() => import('./price-circles'), {
  ssr: false,
  loading: () => <div className={styles.background} />,
});

const PricingSection = () => {
  return (
    <section className={styles.pricingSection}>
        <div className={styles.background}>
            <PriceCircles />
        </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2>Flexible Pricing for Every Creator</h2>
          <p>
            Choose the plan that fits your community's scale and ambition. Start for free.
          </p>
        </div>
        <div className={styles.pricingGrid}>
          {pricingData.map((data) => (
            <div key={data.title} className={styles.pricingCardWrapper}>
              <PricingCard 
                {...data} 
                features={data.features}
              />
            </div>
          ))}
        </div>
        <Button variant="outline" asChild size="lg"><a href="#">Join the waitlist</a></Button>
      </div>
    </section>
  );
};

export default PricingSection;
