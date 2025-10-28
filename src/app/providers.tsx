'use client';

import React from 'react';
// This file can be used to wrap providers around your app
// Example:
// import { AuthProvider } from '@/contexts/auth-context';
// export function Providers({ children }: { children: React.ReactNode }) {
//   return <AuthProvider>{children}</AuthProvider>;
// }

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
