'use client';
import React from 'react';
import styles from './SlidingCards.module.css';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface SlidingCardItemProps {
  title: string;
  subtitle?: string;
  text: string;
  buttonText: string;
  color?: 'blue' | 'green' | 'purple' | 'rose' | 'gray';
  content?: React.ReactNode;
}

const SlidingCardItem: React.FC<SlidingCardItemProps> = ({ 
  title, 
  subtitle,
  text, 
  buttonText,
  color = 'gray',
  content,
}) => {
  return (
    <div className={cn(styles.card, styles[color])}>
        {content ? (
          <div className={styles.splitContent}>
            <div className={styles.leftPane}>
              {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
              <h2 className={styles.cardTitle}>{title}</h2>
              <p className={styles.cardText}>{text}</p>
              <Button variant="outline" size="lg">{buttonText}</Button>
            </div>
            <div className={styles.rightPane}>
              {content}
            </div>
          </div>
        ) : (
          <div className={styles.cardContent}>
            {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
            <h2 className={styles.cardTitle}>{title}</h2>
            <p className={styles.cardText}>{text}</p>
            <Button variant="outline" size="lg">{buttonText}</Button>
          </div>
        )}
    </div>
  );
};

export default SlidingCardItem;
