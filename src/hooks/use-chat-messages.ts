
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ChatMessageProps } from '@/components/chat-message';

export function useChatMessages(activeChatId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(true);

  useEffect(() => {
    if (user?.uid && activeChatId) {
      setIsMessagesLoading(true);
      const messagesRef = collection(db, 'users', user.uid, 'chats', activeChatId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const chatMessages = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const id = doc.id;
          
          return { id, ...data } as ChatMessageProps;
        });

        setMessages(chatMessages);
        setIsMessagesLoading(false);
      }, (error) => {
        console.error("Error fetching messages:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load chat messages.' });
        setIsMessagesLoading(false);
      });
      
      return () => unsubscribe();
    } else {
      setMessages([]);
      setIsMessagesLoading(false);
    }
  }, [user?.uid, activeChatId, toast]);

  return { messages, isMessagesLoading };
}
