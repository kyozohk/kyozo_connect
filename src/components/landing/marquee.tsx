'use client';

import React, { useMemo } from 'react';
import styles from './Marquee.module.css';
import { FaCircleCheck } from "react-icons/fa6";

// Category types for the marquee
type CategoryType = 'music' | 'artMovements' | 'crafts' | 'fashion' | 'performance';

interface Item {
  text: string;
}

interface RowProps {
  items: Item[];
  direction: 'left' | 'right';
  speed?: number;
  category: CategoryType;
}

const Row: React.FC<RowProps> = ({ 
  items, 
  direction, 
  speed = 10, 
  category 
}) => {
  // Create enough duplicates to fill the screen width
  const repeatedItems = useMemo(() => {
    // Create 4 sets of items to ensure the row is never empty
    const repeated = [];
    for (let i = 0; i < 4; i++) {
      repeated.push(...items);
    }
    return repeated;
  }, [items]);
  
  return (
    <div className={styles.rowContainer}>
      <div 
        className={`${styles.row} ${direction === 'right' ? styles.toRight : styles.toLeft}`}
        style={{ 
          '--scroll-duration': `${speed}s`
        } as React.CSSProperties}
      >
        {/* First set of repeated items */}
        {repeatedItems.map((item, index) => (
          <div 
            key={`item-${index}`} 
            className={`${styles.item} ${styles[category]}`}
          >
            <FaCircleCheck size={24}/> <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface TopicMarqueeProps {
  categories: {
    category: CategoryType;
    items: Item[];
  }[];
}

const TopicMarquee: React.FC<TopicMarqueeProps> = ({ categories }) => {
  return (
    <div className={styles.marqueeContainer}>
      {categories.map((row, index) => (
        <Row 
          key={`row-${index}`}
          items={row.items}
          direction={index % 2 === 0 ? 'left' : 'right'}
          speed={80} // Slower animation for better readability
          category={row.category}
        />
      ))}
    </div>
  );
};

export default TopicMarquee;
