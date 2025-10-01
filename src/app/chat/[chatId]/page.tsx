// src/app/chat/[chatId]/page.tsx


// We keep the actual chat UI in a client component.
// This server component wrapper exists to satisfy the Edge Runtime requirement for dynamic routes.
import ChatPage from '../page';

export default function ChatWithIdPage() {
  return <ChatPage />;
}