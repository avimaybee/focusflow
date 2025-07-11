
'use client';

// This component is essentially a client-side entry point that renders the main 
// ChatPage component. This allows us to have a dynamic route for chats
// while reusing the entire existing chat page logic.
import ChatPage from '../page';

export default function ChatWithIdPage() {
  return <ChatPage />;
}
