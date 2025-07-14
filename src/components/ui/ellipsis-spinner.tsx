'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface EllipsisSpinnerProps {
  size?: string;
  dotSize?: string;
  color?: string;
  speed?: string;
  label?: string;
  className?: string;
}

export function EllipsisSpinner({
  size = '80px',
  dotSize, // Let CSS calculate default based on size
  color, // Let CSS use default (--primary)
  speed = '0.6s',
  label = 'Loading…',
  className,
}: EllipsisSpinnerProps) {
  const style = {
    '--spinner-size': size,
    '--dot-size': dotSize,
    '--spinner-color': color,
    animationDuration: speed,
  } as React.CSSProperties;

  return (
    <div
      className={cn("lds-ellipsis", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
      style={style}
    >
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}
