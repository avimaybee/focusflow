
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

  const forceRefresh = useCallback(() => {
    if (!user?.uid) {
        setIsLoading(false);
        setChatHistory([]);
        return () => {};
    };
    
    setIsLoading(true);
    const sessionsRef = collection(db, 'sessions');
    const q = query(sessionsRef, orderBy('updatedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const history = querySnapshot.docs
        .filter(doc => doc.id.startsWith(user.uid))
        .map(doc => {
            const data = doc.data();
            const firstUserMessage = data.history?.find((m: any) => m.role === 'user');
            
            let title = 'New Chat';
            if (firstUserMessage?.content) {
                const textPart = firstUserMessage.content.find((p:any) => p.text);
                const mediaPart = firstUserMessage.content.find((p:any) => p.media);
                if (textPart?.text) {
                    title = textPart.text;
                } else if (mediaPart) {
                    title = 'Media context';
                }
            }
            
            return {
                id: doc.id.split('_')[1], // Return only the chat-specific part of the ID
                title: title.substring(0, 50),
                createdAt: data.updatedAt || Timestamp.now(),
            } as ChatHistoryItem;
        });
      setChatHistory(history);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching chat history:", error);
      setIsLoading(false);
    });
    return unsubscribe;

  }, [user?.uid]);

  useEffect(() => {
    const unsubscribe = forceRefresh();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [forceRefresh]);

  return { chatHistory, isLoading, forceRefresh };
}
