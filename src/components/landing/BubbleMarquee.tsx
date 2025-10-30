'use client';

import React, { useMemo } from 'react';
import styles from './BubbleMarquee.module.css';

// Define the bubble row colors based on the image
const bubbleRowColors = {
  music: '#3b82f6',        // Blue accent for music
  artMovements: '#8b5cf6', // Purple accent for art movements
  crafts: '#f97316',       // Orange accent for crafts
  fashion: '#ec4899',      // Pink accent for fashion
  performance: '#14b8a6',  // Teal accent for performance
  techno: '#3b82f6',       // Blue accent for techno
  futurism: '#6192D1',     // Purple accent for futurism
  classicism: '#BB6DC9',   // Purple accent for classicism
  jewelry: '#FFD861',      // Orange accent for jewelry
  vintage: '#C7736C',      // Pink accent for vintage
  minimal: '#EEF840',      // Teal accent for minimal
};

interface BubbleItem {
  text: string;
  color?: string;
  spaceBefore?: 'none' | 'small' | 'medium';
  spaceAfter?: 'none' | 'small' | 'medium';
}

interface BubbleRowProps {
  items: BubbleItem[];
  direction: 'left' | 'right';
  speed?: number;
  category: keyof typeof bubbleRowColors;
}

const BubbleRow: React.FC<BubbleRowProps> = ({ 
  items, 
  direction, 
  speed = 10, 
  category 
}) => {
  const rowColor = bubbleRowColors[category];
  
  // Use items directly since we now have multiple items per row
  const enhancedItems = useMemo(() => {
    // No need for special handling since we have multiple items per row
    return items;
  }, [items]);
  
  // Create enough duplicates to fill the screen width
  const repeatedItems = useMemo(() => {
    // Create enough sets of items to ensure the row is never empty
    const repeated = [];
    for (let i = 0; i < 10; i++) {
      repeated.push(...enhancedItems);
    }
    return repeated;
  }, [enhancedItems]);
  
  return (
    <div className={styles.bubbleRowContainer}>
      <div 
        className={`${styles.bubbleRow} ${direction === 'right' ? styles.toRight : styles.toLeft}`}
        style={{ 
          '--scroll-duration': `${speed}s`,
        } as React.CSSProperties}
      >
        {repeatedItems.map((item, index) => {
          // No additional spacing needed since bubbles now touch each other
          const spacingStyle: React.CSSProperties = {};
          
          return (
            <div 
              key={`item-${index}`} 
              className={styles.bubble}
              style={{ 
                borderColor: rowColor,
                '--hover-bg': rowColor,
                ...spacingStyle
              } as React.CSSProperties}
            >
              {item.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface BubbleMarqueeProps {
  categories: {
    category: keyof typeof bubbleRowColors;
    items: BubbleItem[];
  }[];
}

const BubbleMarquee: React.FC<BubbleMarqueeProps> = ({ categories }) => {
  return (
    <div className={styles.bubbleMarqueeContainer}>
      {categories.map((row, index) => (
        <BubbleRow 
          key={`row-${index}`}
          items={row.items}
          direction={index % 2 === 0 ? 'left' : 'right'}
          speed={100} // Moderate speed for smooth animation
          category={row.category}
        />
      ))}
    </div>
  );
};

export default BubbleMarquee;
