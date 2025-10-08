
"use client";

import { useLanguage } from './language-context';
import type { Language } from '@/lib/cms-store';

// This is a wrapper component to pass the client-side language context 
// to a server component's children.
export function LanguageProviderWrapper({ children }: { children: (language: Language) => React.ReactNode }) {
  const { language } = useLanguage();
  return <>{children(language)}</>;
}
