'use client';

import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const messageVariants = cva('flex flex-col gap-2 p-4', {
  variants: {
    from: {
      user: 'items-end',
      assistant: 'items-start',
    },
  },
});

export type AIMessageProps = ComponentProps<'div'> &
  VariantProps<typeof messageVariants>;

export const AIMessage = ({
  className,
  from,
  children,
  ...props
}: AIMessageProps) => (
  <div className={messageVariants({ from, className })} {...props}>
    {children}
  </div>
);
AIMessage.displayName = 'AIMessage';

const messageContentVariants = cva(
  'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
  {
    variants: {
      from: {
        user: 'bg-primary text-primary-foreground',
        assistant: 'bg-secondary',
      },
    },
  }
);
export type AIMessageContentProps = ComponentProps<'div'> &
  VariantProps<typeof messageContentVariants>;

export const AIMessageContent = ({
  className,
  from,
  ...props
}: AIMessageContentProps) => (
  <div className={messageContentVariants({ from, className })} {...props} />
);
AIMessageContent.displayName = 'AIMessageContent';
