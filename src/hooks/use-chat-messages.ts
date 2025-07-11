
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ChatMessageProps } from '@/components/chat-message';
import { Dispatch } from 'react';

export function useChatMessages(activeChatId: string | null, dispatch: Dispatch<any>) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    if (user?.uid && activeChatId) {
      setIsHistoryLoading(true);
      const messagesRef = collection(db, 'users', user.uid, 'chats', activeChatId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const chatMessages = querySnapshot.docs.map(doc => {
          const data = doc.data();
          try {
            const parsedText = JSON.parse(data.text);
            if (parsedText.role) {
                return { id: doc.id, ...parsedText, createdAt: data.createdAt };
            }
            return { id: doc.id, role: data.role, text: data.text, createdAt: data.createdAt };
          } catch (e) {
            return { id: doc.id, role: data.role, text: data.text, createdAt: data.createdAt };
          }
        });
        dispatch({ type: 'SET_MESSAGES', payload: chatMessages });
        setIsHistoryLoading(false);
      }, (error) => {
        console.error("Error fetching messages:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load chat messages.' });
        setIsHistoryLoading(false);
      });
      return () => unsubscribe();
    } else {
      dispatch({ type: 'SET_MESSAGES', payload: [] });
      setIsHistoryLoading(false);
    }
  }, [user?.uid, activeChatId, toast, dispatch]);

  return { isHistoryLoading };
}
