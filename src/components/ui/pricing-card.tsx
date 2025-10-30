'use client';

import React, { useState, useEffect } from 'react';
import type { PricingCardData } from '@/lib/types';
import styles from './PricingCard.module.css';
import { FaCircleCheck } from "react-icons/fa6";

const PricingCard: React.FC<PricingCardData> = ({
  title,
  subtitle,
  price,
  priceDescription,
  features,
  gradient,
  subtitleColor,
}) => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCount(prevCount => {
        if (prevCount < features.length) {
          return prevCount + 1;
        }
        clearInterval(interval);
        return prevCount;
      });
    }, 200); // Stagger animation by 200ms

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [features.length]);

  const colorMap: Record<string, string> = {
    'from-blue-500': 'hsl(var(--accent))',
    'to-cyan-500': '#06b6d4',
    'from-purple-500': 'hsl(var(--primary))',
    'to-pink-500': 'hsl(var(--primary))',
    'from-amber-500': '#f59e0b',
    'to-orange-500': '#f97316',
  };

  const fromColor = gradient.split(' ')[0];

  const style = {
    '--from-color': colorMap[fromColor] || 'hsl(var(--primary))',
  } as React.CSSProperties;

  return (
    <div className={styles.gradientBorder} style={style}>
      <div className={styles.card}>
        <div className={styles.backgroundPattern}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className={styles.patternSvg}>
            <defs>
              <pattern id="wavy-lines" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="translate(0,0)">
                <path d="M 0 40 C 10 40 10 20 20 20 C 30 20 30 40 40 40 C 50 40 50 60 60 60 C 70 60 70 40 80 40" stroke="currentColor" fill="none" strokeWidth="1"></path>
              </pattern>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#wavy-lines)"></rect>
          </svg>
        </div>
        
        <div className={styles.cardContent}>
          <header>
            <h2 className={styles.title}>{title}</h2>
            <div className={styles.divider}></div>
            <p className={styles.subtitle}>
              {subtitle}
            </p>
            <p className={styles.price}>
              {price} <span>{priceDescription}</span>
            </p>
          </header>

          <ul className={styles.featuresList}>
            {features.map((feature, index) => (
              <li 
                key={index}
                className={`${styles.featureItem} ${index < visibleCount ? styles.visible : styles.hidden}`}
              >
                <FaCircleCheck className={styles.checkIcon} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PricingCard;
