import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, MessageCircle, Ticket, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Users,
    title: 'Community Management',
    description: 'Create and manage isolated, multi-tenant communities with powerful role-based access control.',
  },
  {
    icon: MessageCircle,
    title: 'Omnichannel Communication',
    description: 'Engage your members with in-app chat, email broadcasts, and WhatsApp integrations.',
  },
  {
    icon: Ticket,
    title: 'Event Ticketing',
    description: 'Host events with built-in ticketing powered by Stripe, or integrate with platforms like Eventbrite.',
  },
  {
    icon: ShieldCheck,
    title: 'AI Content Moderation',
    description: 'Keep your community safe with AI-powered tools that detect and flag toxic content automatically.',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32 bg-black">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-headline md:text-4xl">Everything You Need to Build a Thriving Community</h2>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Kyozo provides a robust suite of tools designed for the next generation of creative leaders and their communities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card/80 border-border/50 hover:border-primary/50 hover:-translate-y-1 transition-transform duration-300 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                <CardDescription className="pt-2">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
