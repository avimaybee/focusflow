
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';

export interface ChatHistoryItem {
  id: string;
  title: string;
  lastMessagePreview?: string;
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
      return;
    }

    setIsLoading(true);
    // Point to the correct subcollection for the logged-in user
    const chatsRef = collection(db, 'users', user.uid, 'chats');
    const q = query(chatsRef, orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const history = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          // Find the first user message to use as a title
          const firstUserMessage = data.history?.find((m: any) => m.role === 'user');
          const lastMessage = data.history?.[data.history.length - 1];
          
          let title = data.title || 'New Chat';
          if (!data.title && firstUserMessage?.content) {
            const textPart = firstUserMessage.content.find((p: any) => p.text);
            if (textPart?.text) {
              title = textPart.text;
            } else {
              const mediaPart = firstUserMessage.content.find((p: any) => p.media);
              if (mediaPart) {
                title = 'Chat with media';
              }
            }
          }

          let lastMessagePreview = '';
          if (lastMessage?.content) {
            const textPart = lastMessage.content.find((p: any) => p.text);
            if (textPart?.text) {
              lastMessagePreview = textPart.text;
            } else if (lastMessage.role === 'user') {
              lastMessagePreview = 'Context item sent';
            } else {
              lastMessagePreview = 'AI response';
            }
          }


          return {
            id: doc.id,
            title: title.substring(0, 50),
            lastMessagePreview: lastMessagePreview.substring(0, 70),
            createdAt: data.updatedAt || Timestamp.now(),
          } as ChatHistoryItem;
        });
        setChatHistory(history);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching chat history:', error);
        setIsLoading(false);
      }
    );

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
