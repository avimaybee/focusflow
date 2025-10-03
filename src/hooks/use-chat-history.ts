'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { getChatSessions } from '@/lib/chat-actions';
import type { ChatSession } from '@/lib/chat-actions';

export function useChatHistory() {
  const { user } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setChatHistory([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await getChatSessions(user.id);
      if (error) {
        throw new Error(error.message);
      }
      setChatHistory(data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch chat history.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { chatHistory, isLoading, error, forceRefresh: fetchHistory };
}