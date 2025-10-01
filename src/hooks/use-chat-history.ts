'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { getChatHistory } from '@/lib/chat-actions';

export interface ChatHistoryItem {
  id: string;
  title: string;
  lastMessagePreview?: string;
  createdAt: Date;
}

export function useChatHistory() {
  const { user } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const forceRefresh = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const history = await getChatHistory(user.id);
      setChatHistory(history);
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      setChatHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    forceRefresh();
  }, [forceRefresh]);

  return { chatHistory, isLoading, forceRefresh };
}