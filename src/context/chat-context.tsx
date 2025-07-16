
'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

interface ChatState {
  messageToSend: { text: string; attachmentUrl: string | null; personaId: string } | null;
  setMessageToSend: Dispatch<SetStateAction<{ text: string; attachmentUrl: string | null; personaId: string } | null>>;
  isSending: boolean;
  setIsSending: Dispatch<SetStateAction<boolean>>;
  guestMessageCount: number;
  setGuestMessageCount: Dispatch<SetStateAction<number>>;
}

const ChatContext = createContext<ChatState | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messageToSend, setMessageToSend] = useState<{ text: string; attachmentUrl: string | null; personaId: string } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [guestMessageCount, setGuestMessageCount] = useState(0);

  return (
    <ChatContext.Provider
      value={{
        messageToSend,
        setMessageToSend,
        isSending,
        setIsSending,
        guestMessageCount,
        setGuestMessageCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
