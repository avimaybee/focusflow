
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';

export interface ChatHistoryItem {
  id: string;
  title: string;
  createdAt: Timestamp;
}

export function useChatHistory() {
  const { user } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      setIsLoading(true);
      const chatsRef = collection(db, 'users', user.uid, 'chats');
      const q = query(chatsRef, orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const history = querySnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title,
          createdAt: doc.data().createdAt,
        }));
        setChatHistory(history);
        setIsLoading(false);
      }, () => {
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
        setChatHistory([]);
        setIsLoading(false);
    }
  }, [user?.uid]);

  return { chatHistory, isLoading };
}
