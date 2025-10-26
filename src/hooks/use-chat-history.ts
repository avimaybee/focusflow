'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';

export interface ChatHistoryItem {
  id: string;
  title: string;
  lastMessagePreview?: string;
  createdAt: Date;
}

export function useChatHistory() {
  const { user, session } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const forceRefresh = useCallback(async () => {
    if (!user || !session?.access_token) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/chat/history?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const history = data.map((item: { id: string; title: string; createdAt: string }) => ({
          id: item.id,
          title: item.title,
          createdAt: new Date(item.createdAt),
        }));
        setChatHistory(history);
      } else {
        console.error('Failed to fetch chat history:', response.status);
        setChatHistory([]);
      }
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      setChatHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    forceRefresh();
  }, [forceRefresh]);

  return { chatHistory, isLoading, forceRefresh };
}