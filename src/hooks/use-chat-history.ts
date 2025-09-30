'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';

export interface ChatHistoryItem {
  id: string;
  title: string;
  lastMessagePreview?: string;
  createdAt: Date;
}

export function useChatHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const forceRefresh = useCallback(async () => {
    if (!user) {
      setChatHistory([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedHistory = data.map(item => ({
        id: item.id,
        title: item.title || 'Untitled Chat',
        createdAt: new Date(item.created_at),
      }));

      setChatHistory(formattedHistory);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Load History',
        description: 'Could not load your chat history. Please try again later.',
      });
      setChatHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    forceRefresh();
  }, [forceRefresh, user]);

  return { chatHistory, isLoading, forceRefresh };
}