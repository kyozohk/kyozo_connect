'use client';

import React, { useState, useEffect } from 'react';

import styles from './Hero.module.css';

interface HeroProps {
  text?: string;
}

const Hero: React.FC<HeroProps> = ({ 
  text = 'Discover Your Creative Universe'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const words = text.split(' ');

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={`${styles.heroContainer} full-width-container`}>
      <div className={`${styles.gradient} ${styles.topLeft}`}></div>
      <div className={`${styles.gradient} ${styles.topRight}`}></div>
      <div className={styles.topAnimationContainer}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g className={styles.animatedSvg}>
            <circle
              cx="440"
              cy="440"
              r="120"
              stroke="#EEC87E"
              strokeOpacity="1.0"
              strokeWidth="50"
            />
            <circle
              cx="440"
              cy="440"
              r="220"
              stroke="#EEC87E"
              strokeOpacity="1.0"
              strokeWidth="50"
            />
          </g>
        </svg>
      </div>
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>
          {words.map((word, wordIndex) => (
            <span key={wordIndex} className={styles.word}>
              {word.split('').map((letter, letterIndex) => (
                <span
                  key={`${wordIndex}-${letterIndex}`}
                  className={`${styles.letter} ${isLoaded ? styles.loaded : ''}`}
                  style={{ transitionDelay: `${(wordIndex * word.length + letterIndex) * 0.05}s` }}
                >
                  {letter === ' ' ? '\u00A0' : letter}
                </span>
              ))}
              {/* Add a space after each word except the last one */}
              {wordIndex < words.length - 1 && <span className={styles.wordSpace}></span>}
            </span>
          ))}
        </h1>
      </div>
    </div>
  );
};

export default Hero;
