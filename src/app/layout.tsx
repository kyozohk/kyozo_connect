import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import { FirebaseClientProvider, FirebaseErrorListener } from '@/firebase';

export const metadata: Metadata = {
  title: 'KyozoConnect',
  description: 'Connect with your communities.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased w-screen overflow-x-hidden">
        <FirebaseClientProvider>
          <Providers>
            <SidebarProvider>
              {children}
            </SidebarProvider>
            <Toaster />
            <FirebaseErrorListener />
          </Providers>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
