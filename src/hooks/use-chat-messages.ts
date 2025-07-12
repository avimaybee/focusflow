
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
          
          // This is the new, clean format. Trust it.
          if (data.rawText) {
            return { id, ...data } as ChatMessageProps;
          }

          // This handles old messages that do not have a rawText field.
          if (typeof data.text === 'string') {
            try {
              // Check if it's an old AI message stored as a JSON string.
              const parsedText = JSON.parse(data.text);
              if (typeof parsedText === 'object' && parsedText !== null && parsedText.role === 'model') {
                const displayText = parsedText.text || '';
                // Sanitize the old data by creating a rawText field from stripped HTML.
                const rawText = displayText.replace(/<[^>]*>/g, '');
                return { id, ...parsedText, text: displayText, rawText: rawText, createdAt: data.createdAt };
              }
            } catch (e) {
              // If JSON.parse fails, it's a plain text user message. It's already clean.
              return { id, ...data, rawText: data.text } as ChatMessageProps;
            }
          }
          
          // Fallback for any other case.
          return { id, ...data, rawText: data.text } as ChatMessageProps;
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
