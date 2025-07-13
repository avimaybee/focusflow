
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';

export interface ChatHistoryItem {
  id: string; // This will now be the session ID
  title: string;
  createdAt: Timestamp;
}

export function useChatHistory() {
  const { user } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(() => {
    if (user?.uid) {
      setIsLoading(true);
      const sessionsRef = collection(db, 'users', user.uid, 'sessions');
      const q = query(sessionsRef, orderBy('updatedAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const history = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Use the first user message as the title, fallback to a default.
            const firstUserMessage = data.history?.find((m: any) => m.role === 'user');
            const title = firstUserMessage?.content?.[0]?.text || 'New Chat';
            return {
                id: doc.id,
                title: title.substring(0, 50),
                createdAt: data.updatedAt || Timestamp.now(),
            }
        });
        setChatHistory(history as ChatHistoryItem[]);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching chat history:", error);
        setIsLoading(false);
      });
      return unsubscribe;
    } else {
        setChatHistory([]);
        setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    const unsubscribe = fetchHistory();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [fetchHistory]);

  return { chatHistory, isLoading, forceRefresh: fetchHistory };
}
