
'use client';

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // md breakpoint in Tailwind

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false); // Default to false for SSR

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Set the initial state on the client after mount
    checkIsMobile(); 

    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}

    