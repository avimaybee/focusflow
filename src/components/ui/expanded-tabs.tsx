
'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Tab = {
  title: string;
  icon: React.ElementType;
  type?: 'tab';
};

type Separator = {
  type: 'separator';
};

type TabItem = Tab | Separator;

interface ExpandedTabsProps {
  tabs: TabItem[];
  activeColor?: string;
  className?: string;
  onTabChange?: (title: string) => void;
}

export function ExpandedTabs({
  tabs,
  activeColor = 'text-primary-foreground', // Set default to foreground for contrast on primary bg
  className,
  onTabChange,
}: ExpandedTabsProps) {
  const [activeTab, setActiveTab] = React.useState(0);

  const handleTabClick = (index: number, title: string) => {
    setActiveTab(index);
    if (onTabChange) {
      onTabChange(title);
    }
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full border border-border/60 bg-secondary/50 p-1.5',
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === 'separator') {
          return (
            <div
              key={index}
              className="h-5 w-px bg-border/80 mx-2"
            />
          );
        }

        const isActive = activeTab === index;
        const Icon = tab.icon;

        return (
          <div key={index} className="relative">
            <button
              onClick={() => handleTabClick(index, tab.title)}
              className={cn(
                'relative z-10 flex items-center gap-2 px-4 py-1.5 text-sm font-medium transition-colors',
                isActive ? activeColor : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? activeColor : 'text-muted-foreground')} />
              {tab.title}
            </button>
            {isActive && (
              <motion.div
                layoutId="active-tab-background"
                className={cn('absolute inset-0 rounded-full bg-primary')}
                style={{ borderRadius: 9999 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
