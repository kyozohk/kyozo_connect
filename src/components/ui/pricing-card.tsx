'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import styles from './PricingCard.module.css';

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
}

const PricingCard: React.FC<PricingCardProps> = ({ title, price, description, features }) => {
  return (
    <div className={styles.pricingCard}>
      <div className={styles.header}>
        <h3>{title}</h3>
        <p>{price}</p>
        <p>{description}</p>
      </div>
      <div className={styles.features}>
        <ul>
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>
      <div className={styles.footer}>
        <Button>Get Started</Button>
      </div>
    </div>
  );
};

export default PricingCard;
