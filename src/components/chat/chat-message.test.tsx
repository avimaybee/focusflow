import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChatMessage, type ChatMessageProps } from './chat-message';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

// Mock hooks
vi.mock('@/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

// Mock child components
vi.mock('@/components/flashcard-viewer', () => ({
  FlashcardViewer: vi.fn(() => <div data-testid="flashcard-viewer" />),
}));
vi.mock('@/components/quiz-viewer', () => ({
  QuizViewer: vi.fn(() => <div data-testid="quiz-viewer" />),
}));
vi.mock('@/components/smart-tools-menu', () => ({
  SmartToolsMenu: vi.fn(() => <div data-testid="smart-tools-menu" />),
}));
vi.mock('@/components/notes/text-selection-menu', () => ({
    TextSelectionMenu: vi.fn(() => null),
}));
vi.mock('@/components/ui/markdown-renderer', () => ({
    MarkdownRenderer: ({ content }: { content: string }) => <div>{content}</div>
}));


// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('ChatMessage', () => {
  let mockToast;

  beforeEach(() => {
    vi.clearAllMocks();
    mockToast = vi.fn();
    (useAuth as vi.Mock).mockReturnValue({ user: { uid: 'test-user' } });
    (useToast as vi.Mock).mockReturnValue({ toast: mockToast });
    (navigator.clipboard.writeText as vi.Mock).mockResolvedValue(undefined);
  });

  const defaultProps: ChatMessageProps = {
    role: 'user',
    text: 'Hello, this is a user message.',
    rawText: 'Hello, this is a user message.',
  };

  it('renders a user message correctly', () => {
    render(<ChatMessage {...defaultProps} userName="Guest" />);
    expect(screen.getByText(defaultProps.text as string)).toBeInTheDocument();
    expect(screen.getByTestId('User-icon')).toBeInTheDocument();
  });

  it('renders an AI message correctly', () => {
    const aiProps: ChatMessageProps = {
      ...defaultProps,
      role: 'model',
      text: 'Hello, this is an AI message.',
      persona: { id: 'ai', name: 'AI Assistant', avatarUrl: '/avatar.png' },
    };
    render(<ChatMessage {...aiProps} />);
    expect(screen.getByText(aiProps.text as string)).toBeInTheDocument();
    expect(screen.getByTestId('Bot-icon')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
  });

  it('renders flashcards when flashcard data is provided', () => {
    const flashcardProps: ChatMessageProps = {
      ...defaultProps,
      role: 'model',
      text: '',
      flashcards: [{ question: 'Q1', answer: 'A1' }],
    };
    render(<ChatMessage {...flashcardProps} />);
    expect(screen.getByTestId('flashcard-viewer')).toBeInTheDocument();
  });

  it('handles copy to clipboard', () => {
    const aiProps: ChatMessageProps = {
      ...defaultProps,
      role: 'model',
      rawText: 'Copy this text',
    };
    render(<ChatMessage {...aiProps} />);
    
    const copyButton = screen.getByTestId('Copy-icon').parentElement;
    expect(copyButton).toBeInTheDocument();

    fireEvent.click(copyButton!);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Copy this text');
    expect(mockToast).toHaveBeenCalledWith({ title: 'Copied to clipboard!' });
  });

  it('renders an error message with correct styling', () => {
    const errorProps: ChatMessageProps = {
      ...defaultProps,
      role: 'model',
      text: 'An error occurred.',
      isError: true,
    };
    const { container } = render(<ChatMessage {...errorProps} />);
    expect(screen.getByText(errorProps.text as string)).toBeInTheDocument();
    // Check for a class that indicates an error state
    const messageContainer = container.querySelector('.bg-destructive\\/10');
    expect(messageContainer).toBeInTheDocument();
  });
});
