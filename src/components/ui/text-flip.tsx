'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export const TextFlip = ({
  words,
  duration = 3000,
  className,
}: {
  words: string[];
  duration?: number;
  className?: string;
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, duration);

    return () => clearInterval(interval);
  }, [words, duration]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={words[index]}
        className={cn('inline-block', className)}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={{
          initial: {
            opacity: 0,
          },
          animate: {
            opacity: 1,
            transition: {
              staggerChildren: 0.08,
            },
          },
          exit: {
            opacity: 0,
          },
        }}
      >
        {words[index].split('').map((char, i) => (
          <motion.span
            key={i}
            className="inline-block"
            variants={{
              initial: {
                opacity: 0,
                y: 20,
                filter: 'blur(8px)',
              },
              animate: {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                transition: {
                  duration: 0.5,
                  ease: 'easeOut',
                },
              },
              exit: {
                opacity: 0,
                y: -20,
                filter: 'blur(8px)',
                transition: {
                  duration: 0.3,
                  ease: 'easeIn',
                },
              },
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};
