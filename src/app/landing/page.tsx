'use client';

import HeroSection from '@/components/landing/hero-section';
import FeatureCard from '@/components/landing/feature-card';
import ScrollRevealText from '@/components/landing/scroll-reveal-text';
import SlidingCards from '@/components/landing/sliding-cards';
import SlidingCardItem from '@/components/landing/sliding-card-item';
import Toolkit from '@/components/landing/toolkit';
import TopicMarquee from '@/components/landing/marquee';
import PricingSection from '@/components/landing/pricing-section';
import VideoWall from '@/components/landing/video-wall';
import BottomText from '@/components/landing/bottom-text';
import ParallaxGallery from '@/components/landing/parallax-gallery';
import Image from 'next/image';
import BubbleMarquee from '@/components/landing/bubble-marquee';
import Footer from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background w-screen overflow-x-hidden">
      <main className="flex-1">
        <HeroSection />
        <FeatureCard />
        <section className="container py-20 md:py-32 text-center">
            <ScrollRevealText text="Where creative minds converge" />
        </section>
        <SlidingCards>
          <SlidingCardItem 
            subtitle="INSIDER ACCESS"
            title="Exclusive access and insights"
            text="Experience the creative world through an insider's lens. Kyozo is an eco-system of creative communities - that gives you exclusive access to updates and insights from the creative luminaries driving cultural evolution."
            buttonText="Join the waitlist"
            color="gray"
            content={<VideoWall />}
          />
          <SlidingCardItem 
            subtitle="COMMUNITY ACCESS"
            title="Engage with visionary communities"
            text="Join and interact with diverse communities, from niche artistic circles to industry-leading collectives. Engage with passionate individuals who share your creative interests."
            buttonText="Join the waitlist"
            color="gray"
            content={<ParallaxGallery />}
          />
          <SlidingCardItem 
            subtitle="CREATOR TOOLS"
            title="Grow your creative community"
            text="Are you a creative professional, community organizer, or small business owner working within the creative industries? We understand the challenges of nurturing and growing a dedicated audience, so we built KyozoPro, a comprehensive platform that enhances genuine connections and unlocks new opportunities."
            buttonText="Join the waitlist"
            color="gray"
            content={<Image src="/card-3.png" alt="Phone" width={600} height={800} style={{objectFit: 'contain', maxHeight: '100%', maxWidth: '100%'}} />}
          />
        </SlidingCards>
        <Toolkit />
        <TopicMarquee 
          categories={[
            {
              category: 'music',
              items: [
                { text: 'Rediscovering your creative passion' },
                { text: 'Prompts to Turbocharge Your Creative Process' },
                { text: 'BPM heartrate and running' },
                { text: 'The creative paradox' },
              ]
            },
            {
                category: 'artMovements',
                items: [
                  { text: 'Exploring Abstract Expressionism' },
                  { text: 'The Impact of Surrealism on Modern Art' },
                  { text: 'Understanding the Bauhaus Movement' },
                  { text: 'Pop Art and Consumer Culture' },
                ]
            },
            {
                category: 'fashion',
                items: [
                  { text: 'Sustainable Fashion Trends' },
                  { text: 'The History of Streetwear' },
                  { text: 'Vintage Fashion Revival' },
                  { text: 'The Art of Accessorizing' },
                ]
            }       
          ]}
        />
        <PricingSection />
        <BubbleMarquee 
          categories={[
            {
              category: 'music',
              items: [
                { text: 'Rock' },
                { text: 'Jazz' },
                { text: 'R&B' },
                { text: 'Trance' },
                { text: 'Techno' },
                { text: 'Hip Hop' },
                { text: 'Classical' },
              ]
            },
            {
              category: 'classicism',
              items: [
                { text: 'Expressionism' },
                { text: 'Futurism' },
                { text: 'Classicism' },
                { text: 'Cubism' },
                { text: 'Surrealism' },
                { text: 'Dadaism' },
              ]
            },
            {
              category: 'jewelry',
              items: [
                { text: 'Wood Burning' },
                { text: 'Candle-making' },
                { text: 'Crochet' },
                { text: 'Jewelry' },
                { text: 'Pottery' },
                { text: 'Weaving' },
              ]
            },
            {
              category: 'vintage',
              items: [
                { text: 'Chic' },
                { text: 'Grunge' },
                { text: 'Vintage' },
                { text: 'Boho' },
                { text: 'Preppy' },
                { text: 'Streetwear' },
              ]
            },
            {
              category: 'minimal',
              items: [
                { text: 'Stand-ups' },
                { text: 'Musical' },
                { text: 'Digital' },
                { text: 'Theatre' },
                { text: 'Dance' },
                { text: 'Opera' },
              ]
            }
          ]}
        />
        <BottomText text="Join the creative universe" />
      </main>
      <Footer />
    </div>
  );
}
