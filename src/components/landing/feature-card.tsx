'use client';
import React from 'react';
import styles from './FeatureCard.module.css';
import Image from 'next/image';
import { Button } from "@/components/ui/button";

const FeatureCard = () => {
  return (
    <div className={styles.cardContainer}>
      <div className={styles.backgroundGradient}>
        <div className={styles.phoneBackgroundGradient}></div>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.leftContent}>
          <h2 className={styles.cardTitle}>Connect. Explore. Engage.</h2>
          <p className={styles.cardDescription}>
            Connect with visionary creators and forward-thinking communities.
          </p>
          <div>
          <Button variant="default" size="lg" asChild>
            <a href="#">Join the waitlist</a>
          </Button>
          </div>
        </div>
        
        <div className={styles.rightContent}>
          <Image src="/iphone.png" alt="Phone" width={400} height={800} className={styles.phoneImage} />
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;
