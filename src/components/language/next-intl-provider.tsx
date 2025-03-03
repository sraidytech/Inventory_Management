"use client"

import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl';
import { useLanguage } from './language-provider';
import { ReactNode, useEffect, useState } from 'react';

interface NextIntlProviderProps {
  children: ReactNode;
}

export function NextIntlProvider({ children }: NextIntlProviderProps) {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<AbstractIntlMessages>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const messages = await import(`@/messages/${language}.json`);
        setMessages(messages.default);
      } catch (error) {
        console.error(`Failed to load messages for ${language}:`, error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [language]);

  if (loading) {
    // You could return a loading indicator here if needed
    return null;
  }

  return (
    <NextIntlClientProvider locale={language} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
