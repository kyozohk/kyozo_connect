'use client';
import React from 'react';
import Image from 'next/image';
import { Button } from "../ui/button";
import Link from 'next/link';

const FeatureCard = () => {
  return (
    <div className="featureCardContainer">
      <div className="featureCardBackgroundGradient">
        <div className="phoneBackgroundGradient"></div>
      </div>
      <div className="featureCardContent">
        <div className="featureCardLeftContent">
          <h2 className="featureCardTitle">Connect. Explore. Engage.</h2>
          <p className="featureCardDescription">
            Connect with visionary creators and forward-thinking communities.
          </p>
          <div>
            <Link href="#" passHref>
              <Button variant="outline" size="lg">Join the waitlist</Button>
            </Link>
          </div>
        </div>
        
        <div className="featureCardRightContent">
          <Image src="/iphone.png" alt="Phone" width={400} height={800} className="phoneImage" />
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;
