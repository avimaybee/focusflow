
import { useReducer } from 'react';
import type { ChatMessageProps } from '@/components/chat-message';
import type { Attachment } from '@/hooks/use-file-upload';

/**
 * @fileoverview Centralized state management for the chat interface using a reducer.
 * This helps manage complex state transitions involving messages, attachments, and loading states.
 */

// 1. State Shape
export interface ChatState {
  messages: ChatMessageProps[];
  attachments: Attachment[];
  isLoading: boolean;
}

// 2. Initial State
export const initialState: ChatState = {
  messages: [],
  attachments: [],
  isLoading: false,
};

// 3. Actions
// Defines all possible state transitions for the chat.
type Action =
  | { type: 'SET_MESSAGES'; payload: ChatMessageProps[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessageProps }
  | { type: 'ROLLBACK_MESSAGE' }
  | { type: 'SET_ATTACHMENTS'; payload: Attachment[] }
  | { type: 'CLEAR_ATTACHMENTS' }
  | { type: 'START_LOADING' }
  | { type: 'STOP_LOADING' };

// 4. Reducer Function
// The core logic that determines how state changes in response to actions.
function chatReducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'ROLLBACK_MESSAGE':
      // Removes the last message, used for rolling back optimistic updates on failure.
      return { ...state, messages: state.messages.slice(0, -1) };
    case 'SET_ATTACHMENTS':
      return { ...state, attachments: action.payload };
    case 'CLEAR_ATTACHMENTS':
      return { ...state, attachments: [] };
    case 'START_LOADING':
      return { ...state, isLoading: true };
    case 'STOP_LOADING':
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

// 5. Custom Hook
// Exports the reducer logic for use in the ChatPage component.
export function useChatReducer() {
  return useReducer(chatReducer, initialState);
}
