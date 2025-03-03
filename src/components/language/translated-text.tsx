"use client"

import { useTranslations } from 'next-intl';

interface TranslatedTextProps {
  namespace: string;
  id: string;
}

export function TranslatedText({ namespace, id }: TranslatedTextProps) {
  const t = useTranslations(namespace);
  
  try {
    return <span>{t(id)}</span>;
  } catch (error) {
    console.error(`Translation error for ${namespace}.${id}:`, error);
    return <span>{`${namespace}.${id}`}</span>; // Fallback to the key
  }
}
