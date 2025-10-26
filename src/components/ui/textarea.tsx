
import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex w-full resize-none border-none bg-transparent px-2 py-2 text-sm text-foreground focus-visible:outline-none scrollbar-hidden',
          'placeholder:text-muted-foreground placeholder:align-middle',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'overflow-y-auto min-h-[24px] max-h-[200px]',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
