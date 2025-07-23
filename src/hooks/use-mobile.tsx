
'use client';

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 1024; // lg breakpoint in Tailwind

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Set the initial state on the client
    checkIsMobile(); 

    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Return undefined during SSR and the actual value on the client
  return isMobile;
}
