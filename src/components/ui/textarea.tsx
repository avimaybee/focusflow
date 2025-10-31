
import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex w-full resize-none rounded-lg px-3 py-2.5 text-sm text-foreground focus-visible:outline-none scrollbar-hidden transition-all duration-200',
          'placeholder:text-foreground/50 placeholder:align-middle placeholder:font-medium',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'overflow-y-auto min-h-[80px] max-h-[200px]',
          // Default styling when not overridden
          'border-2 border-input bg-card/50 backdrop-blur-sm shadow-sm',
          'focus-visible:bg-card focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:shadow-md',
          'hover:border-input/80 disabled:hover:border-input',
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
