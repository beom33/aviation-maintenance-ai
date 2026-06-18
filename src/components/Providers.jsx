'use client';
import { SessionProvider } from 'next-auth/react';
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      <LanguageProvider>{children}</LanguageProvider>
    </SessionProvider>
  );
}
