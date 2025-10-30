import type { PricingCardData } from './types';

export const pricingData: PricingCardData[] = [
  {
    title: 'Kyozo',
    subtitle: 'Community Connection',
    price: 'FREE',
    priceDescription: 'membership',
    features: [
      'Creative Labs content',
      'Connect with like-minded creatives',
      'Explore exclusive content',
      'Discover communities',
      'Early adopter benefits',
    ],
    gradient: 'from-purple-500 to-pink-500',
    subtitleColor: 'purple-400',
  },
  {
    title: 'KyozoPro',
    subtitle: 'Community Growth',
    price: 'PREMIUM',
    priceDescription: 'subscription',
    features: [
      'Creative Labs content',
      'Build and manage your communities',
      'Advanced community app',
      'Audience dashboards',
      'Custom group messaging',
      'Enhanced CRM toolkit',
    ],
    gradient: 'from-blue-500 to-cyan-500',
    subtitleColor: 'blue-400',
  },
];
