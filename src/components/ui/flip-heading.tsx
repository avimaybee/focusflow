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
          key={`${char}-${i}`}
          className="letter-container"
          style={{ '--delay': `${i * 35}ms` } as React.CSSProperties}
        >
          <span className="letter-scroller">
            <span aria-hidden="true">{char === ' ' ? '\u00A0' : char}</span>
            <span aria-hidden="true">{char === ' ' ? '\u00A0' : char}</span>
          </span>
        </span>
      ))}
    </h1>
  );
}
