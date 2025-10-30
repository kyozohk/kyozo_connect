'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './PriceCircles.module.css';

const NUM_CIRCLES = 6;
const SPEED = 0.25;

interface PriceCirclesProps {
  children?: React.ReactNode;
}

const PriceCircles: React.FC<PriceCirclesProps> = ({ children }) => {
  const [time, setTime] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>(0);
  const containerSize = useRef<number>(1000);

  useEffect(() => {
    if (containerRef.current) {
      const { offsetWidth, offsetHeight } = containerRef.current;
      containerSize.current = Math.sqrt(offsetWidth ** 2 + offsetHeight ** 2);
    }

    const animate = (timestamp: number) => {
      setTime(timestamp);
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  const circles = Array.from({ length: NUM_CIRCLES }).map((_, i) => {
    const maxSize = containerSize.current;
    // The gap between circles is based on the number of circles to space them out evenly.
    const initialOffset = (maxSize / NUM_CIRCLES) * i;
    
    const size = ((time * SPEED) + initialOffset) % maxSize;
    
    // Opacity fades as the circle grows.
    const opacity = 0.3 * (1 - size / maxSize);

    return {
      id: i,
      size: size,
      opacity: Math.max(0, opacity),
    };
  });

  return (
    <div className={styles.container}>
      <div 
        ref={containerRef}
        className={styles.animatedConcentricRings}
      >
        {circles.map(circle => (
          <div
            key={circle.id}
            className={styles.circle}
            style={{
              width: `${circle.size}px`,
              height: `${circle.size}px`,
              opacity: circle.opacity,
              transform: 'translate(-50%, -50%)',
              top: '50%',
              left: '50%',
            }}
          />
        ))}
      </div>
      {/* Content container for children */}
      <div className={styles.contentContainer}>
        {children}
      </div>
    </div>
  );
};

export default PriceCircles;
