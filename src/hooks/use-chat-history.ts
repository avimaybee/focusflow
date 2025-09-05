'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';

export interface ChatHistoryItem {
  id: string;
  title: string;
  lastMessagePreview?: string;
  createdAt: Date; // Replaced Timestamp with Date
}

export function useChatHistory() {
  const { user } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const forceRefresh = useCallback(() => {
    // Placeholder for fetching data from Supabase
    setIsLoading(false);
    setChatHistory([]);
  }, []);

  useEffect(() => {
    forceRefresh();
  }, [forceRefresh]);

  return { chatHistory, isLoading, forceRefresh };
}