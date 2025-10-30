'use client';

import React from 'react';
import styles from './Toolkit.module.css';
import ArrowIcon from '../icons/arrow-icon';

interface ToolkitProps {
  description?: string;
  ctaText?: string;
  ctaUrl?: string;
}

// Main component for the Toolkit section
const Toolkit: React.FC<ToolkitProps> = ({
  description = `Explore a dynamic resources hub where creativity meets community. Here you'll find a curated collection of articles, videos and resources designed to inspire, inform and ignite your creative journey. Explore a dynamic resources hub where creativity meets community. Here you'll find a curated collection of articles, videos and resources designed to inspire, inform and ignite your creative journey.`,
  ctaText = 'Check out CreativeLab',
  ctaUrl = '#',
}) => {
  return (
    <>
      <section className={styles.socialMediaSection}>
        <div className={styles.socialMediaTitle}>We are not</div>
        <div className={styles.socialMediaBubble}>
          <span className={styles.socialMediaText}>Social Media</span>
        </div>
      </section>

      <section className={styles.creativeLabSection}>
        <div className={styles.gridContainer}>
          {/* Left side */}
          <div className={styles.leftColumn}>
            <h2 className={styles.creativeLabTitle}>
              CreativeLab
              <br />
              Your creative
              <br />
              toolkit
            </h2>
          </div>

          {/* Right side */}
          <div className={styles.rightColumn}>
            <p className={styles.description}>{description}</p>
            <a href={ctaUrl} className={styles.ctaLink}>
              {ctaText}
              <ArrowIcon />
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default Toolkit;
