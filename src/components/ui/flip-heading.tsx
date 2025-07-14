'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface FlipHeadingProps {
  text: string;
  className?: string;
}

export function FlipHeading({ text, className }: FlipHeadingProps) {
  const letters = Array.from(text);

  return (
    <h1
      className={cn('flip-heading font-heading', className)}
      tabIndex={0}
      aria-label={text}
    >
      {letters.map((char, i) => (
        <span
          key={i}
          className="char-wrapper"
          style={{ '--delay': `${i * 30}ms` } as React.CSSProperties}
        >
          <span className="char-front" aria-hidden="true">
            {char === ' ' ? '\u00A0' : char}
          </span>
          <span className="char-back" aria-hidden="true">
            {char === ' ' ? '\u00A0' : char}
          </span>
        </span>
      ))}
    </h1>
  );
}
