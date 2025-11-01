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
  // Simple module-level cache to reduce duplicate chat history fetches across hook instances
  const globalAny: any = globalThis as any;
  if (!globalAny.__chatHistoryCache) {
    globalAny.__chatHistoryCache = { map: new Map(), promises: new Map() } as any;
  }

  const CACHE_TTL = 30 * 1000; // 30s

  const forceRefresh = useCallback(async () => {
    if (!user || !session?.access_token) {
      setIsLoading(false);
      setChatHistory([]);
      return;
    }

    const cacheKey = user.id;
    const cacheStore = globalAny.__chatHistoryCache;
    const now = Date.now();

    // If we have a fresh cache, use it and still trigger a background refresh
    const cached = cacheStore.map.get(cacheKey);
    if (cached && now - cached.ts < CACHE_TTL) {
      setChatHistory(cached.data);
      setIsLoading(false);
      // start a background refresh but don't wait for it
      (async () => {
        try {
          const response = await fetch(`/api/chat/history?userId=${user.id}`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });
          if (response.ok) {
            const data = await response.json();
            const history = data.map((item: { id: string; title: string; createdAt: string }) => ({
              id: item.id,
              title: item.title,
              createdAt: new Date(item.createdAt),
            }));
            cacheStore.map.set(cacheKey, { data: history, ts: Date.now() });
            setChatHistory(history);
          }
        } catch (e) {
          // ignore background refresh errors
        }
      })();
      return;
    }

    setIsLoading(true);

    // Deduplicate in-flight requests
    if (cacheStore.promises.has(cacheKey)) {
      try {
        const history = await cacheStore.promises.get(cacheKey);
        setChatHistory(history || []);
      } catch (e) {
        setChatHistory([]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const promise = (async () => {
      try {
        const response = await fetch(`/api/chat/history?userId=${user.id}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });
        if (!response.ok) {
          console.error('Failed to fetch chat history:', response.status);
          return [];
        }
        const data = await response.json();
        const history = data.map((item: { id: string; title: string; createdAt: string }) => ({
          id: item.id,
          title: item.title,
          createdAt: new Date(item.createdAt),
        }));
        cacheStore.map.set(cacheKey, { data: history, ts: Date.now() });
        return history;
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
        return [];
      } finally {
        cacheStore.promises.delete(cacheKey);
      }
    })();

    cacheStore.promises.set(cacheKey, promise);

    try {
      const history = await promise;
      setChatHistory(history || []);
    } catch (e) {
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