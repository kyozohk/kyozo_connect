'use client';

import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import styles from './ZoomText.module.css';

interface ZoomTextProps {
  text: string;
  fontSize?: string;
  fontWeight?: number;
  duration?: string;
  delay?: string;
}

const ZoomText: React.FC<ZoomTextProps> = ({
  text,
  fontSize = '6rem',
  fontWeight = 700,
  duration = '500ms',
  delay = '0ms'
}) => {
  // Use intersection observer to detect when element is in view
  const { ref, inView } = useInView({
    /* Only trigger once */
    triggerOnce: true,
    /* Element is considered in view when 20% is visible */
    threshold: 0.2
  });
  
  const [isLoaded, setIsLoaded] = useState(false);
  const words = text.split(' ');
  
  useEffect(() => {
    // Only trigger animation when element is in view
    if (inView) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [inView]);

  return (
    <div 
      ref={ref} // Add ref for intersection observer
      className={styles.container}
    >
      <h1 
        className={`${styles.title} ${isLoaded ? styles.loaded : styles.loading}`}
        style={{
          fontSize: fontSize,
          fontWeight: fontWeight,
          transition: `transform ${duration} ease-out ${delay}, opacity ${duration} ease-out ${delay}`
        }}
      >
        {words.map((word, wordIndex) => (
          <span key={wordIndex} className={styles.word}>
            {word.split('').map((letter, letterIndex) => (
              <span
                key={`${wordIndex}-${letterIndex}`}
                className={styles.letter}
              >
                {letter}
              </span>
            ))}
            {/* Add a space after each word except the last one */}
            {wordIndex < words.length - 1 && <span className={styles.space}></span>}
          </span>
        ))}
      </h1>
    </div>
  );
};

export default ZoomText;
