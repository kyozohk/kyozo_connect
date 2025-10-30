'use client';

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import styles from './SlidingCards.module.css';
import { cn } from '@/lib/utils';

interface SlidingCardsProps {
  children: ReactNode;
  className?: string;
}

const SlidingCards: React.FC<SlidingCardsProps> = ({ children, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const childrenArray = React.Children.toArray(children);
  const numCards = childrenArray.length;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { top, height } = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      const startOffset = viewportHeight * 0.2;
      const scrollableDistance = height - viewportHeight + startOffset;
      const scrolled = -top + startOffset;
      
      if (scrollableDistance > 0) {
        const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance));
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); 

    return () => window.removeEventListener('scroll', handleScroll);
  }, [numCards]);

  const cardsToScrollPast = numCards - 1;
  const cardProgress = scrollProgress * cardsToScrollPast;
  const activeCardIndex = Math.floor(cardProgress);
  const progressInSegment = cardProgress - activeCardIndex;

  const scrollPerCard = 120;
  const transitionDurationRatio = 1.0;

  return (
    <div
      ref={containerRef}
      style={{ 
        height: `${100 + scrollPerCard * cardsToScrollPast}vh`,
        overflowX: 'visible'
      }}
      className={cn(styles.slidingCardsContainer, className)}
    >
      <div className={styles.stickyContainer}>
        {childrenArray.map((child, i) => {
          let transform = 'translateY(100%) scale(1)';
          const zIndex = i;
          let scale = 1;
          let translateY = 100;

          if (i <= activeCardIndex) {
            translateY = 0;
            scale = 1;
            
            if (i < activeCardIndex) {
              scale = 0.9;
            } else if (i === activeCardIndex && activeCardIndex + 1 < numCards) {
              const nextCardProgress = Math.min(1, progressInSegment / transitionDurationRatio);
              const shrinkProgress = nextCardProgress;
              scale = 1 - (shrinkProgress * 0.1);
            }
            
            transform = `translateY(${translateY}%) scale(${scale})`;
          } else if (i === activeCardIndex + 1) {
            const animationProgress = Math.min(1, progressInSegment / transitionDurationRatio);
            translateY = 100 - animationProgress * 100;
            scale = 1;
            transform = `translateY(${translateY}%) scale(${scale})`;
          }

          return (
            <div
              key={i}
              className={styles.cardWrapper}
              style={{
                zIndex,
                transform,
                transformOrigin: 'center center',
              }}
            >
              {child}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SlidingCards;
