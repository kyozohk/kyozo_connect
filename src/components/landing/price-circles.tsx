'use client';

import React, { useEffect, useRef } from 'react';
import styles from './PriceCircles.module.css';

const PriceCircles = () => {
    const containerRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
  
      const createCircle = () => {
        const circle = document.createElement('div');
        circle.classList.add(styles.circle);
        const size = Math.random() * 200 + 50;
        const x = Math.random() * (container.offsetWidth - size);
        const y = Math.random() * (container.offsetHeight - size);
        circle.style.width = `${size}px`;
        circle.style.height = `${size}px`;
        circle.style.left = `${x}px`;
        circle.style.top = `${y}px`;
        container.appendChild(circle);
  
        setTimeout(() => {
          circle.remove();
        }, 4000); // Remove circle after animation
      };
  
      const interval = setInterval(createCircle, 500);
  
      return () => clearInterval(interval);
    }, []);
  
    return <div ref={containerRef} className={styles.container} />;
  };
  
  export default PriceCircles;
  