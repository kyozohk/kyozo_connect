'use client';
import React, { useState, useEffect, useRef } from 'react';
import styles from './ParallaxGallery.module.css';

// Custom hook to track mouse position relative to an element
function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Get mouse position relative to viewport
      setMousePosition({
        x: e.clientX / window.innerWidth * 2 - 1, // -1 to 1 range
        y: e.clientY / window.innerHeight * 2 - 1, // -1 to 1 range
      });
    };
    
    // Track mouse movement globally
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  return { mousePosition, isHovering, setIsHovering };
}

interface ImageData {
  src: string;
  alt: string;
}

interface Transform {
  x: number;
  y: number;
  rotate: number;
}

interface ParallaxImageProps {
  image: ImageData;
  targetTransform: Transform;
  progress: number;
}

interface ParallaxGalleryProps {
  externalMousePosition?: { x: number; y: number };
}

const IMAGES: ImageData[] = [
  { src: '/Parallax1.jpg', alt: 'DJ at a concert with hands up' },
  { src: '/Parallax2.jpg', alt: 'Singer on stage with smoke' },
  { src: '/Parallax3.jpg', alt: 'Breakdancer performing a handstand' },
  { src: '/Parallax4.jpg', alt: 'Audience enjoying a concert' },
  { src: '/Parallax5.jpg', alt: 'Abstract red light streaks' },
];

const TARGET_TRANSFORMS: Transform[] = [
  { x: -12, y: -15, rotate: -8 },
  { x: 12, y: -12, rotate: 5 },
  { x: 0, y: 0, rotate: 0 },
  { x: -15, y: 15, rotate: -5 },
  { x: 15, y: 15, rotate: 8 },
];

const ANIMATION_SCROLL_RANGE = 600;

const ParallaxImage: React.FC<ParallaxImageProps> = ({ image, targetTransform, progress }) => {
  // Amplify the effect for more noticeable movement
  const translateX = targetTransform.x * progress * 1.5;
  const translateY = targetTransform.y * progress * 1.5;
  const rotate = targetTransform.rotate * progress * 0.8;

  return (
    <div
      className={styles['parallax-image']}
      style={{
        transform: `translate(calc(-50% + ${translateX}vw), calc(-50% + ${translateY}vh)) rotate(${rotate}deg)`,
      }}
    >
      <div className={styles['parallax-image__container']}>
        <img
          src={image.src}
          alt={image.alt}
          className={styles['parallax-image__img']}
          draggable="false"
        />
      </div>
    </div>
  );
};

const ParallaxGallery: React.FC<ParallaxGalleryProps> = ({ externalMousePosition }) => {
  // Use our custom hook for mouse tracking
  const { mousePosition, isHovering, setIsHovering } = useMousePosition();
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse enter/leave for the container
  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };
  
  // Track scroll-based animation progress
  const [scrollProgress, setScrollProgress] = useState(0);
  
  useEffect(() => {
    const updateScrollProgress = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Calculate how much of the element is visible
        const elementTop = rect.top;
        const elementHeight = rect.height;
        
        // Progress from 0 to 1 as element comes into view and moves through viewport
        let progress = 0;
        
        if (elementTop < windowHeight && elementTop + elementHeight > 0) {
          // Element is at least partially visible
          const visibleTop = Math.max(0, windowHeight - elementTop);
          const visibleBottom = Math.min(elementHeight, windowHeight - elementTop);
          const visibleHeight = Math.max(0, visibleBottom);
          
          // Calculate progress based on how much is visible and position
          progress = Math.min(visibleHeight / (windowHeight * 0.8), 1);
        }
        
        setScrollProgress(progress);
      }
    };
    
    // Update progress initially and on scroll/resize
    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress);
    window.addEventListener('resize', updateScrollProgress);
    
    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={styles['parallax-gallery']} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles['parallax-gallery__background']}>
        <div className={styles['parallax-gallery__viewport']}>
          <div className={styles['parallax-gallery__relative']}>
            {IMAGES.map((image, index) => {
              // Use scroll progress as primary animation driver
              // Add subtle mouse interaction when hovering
              const baseProgress = scrollProgress;
              const mouseInfluence = isHovering 
                ? Math.min(Math.abs(mousePosition.x * 0.1) + Math.abs(mousePosition.y * 0.1), 0.2)
                : 0;
              
              const finalProgress = Math.min(baseProgress + mouseInfluence, 1);
                
              return (
                <ParallaxImage
                  key={image.src}
                  image={image}
                  targetTransform={TARGET_TRANSFORMS[index]}
                  progress={finalProgress}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParallaxGallery;
