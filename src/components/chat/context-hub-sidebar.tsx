'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotesTab } from '@/components/chat/notes-tab';
import { useContextHubStore } from '@/stores/use-context-hub-store';

export function ContextHubSidebar() {
  const { isContextHubOpen, toggleContextHub } = useContextHubStore();

  return (
    <AnimatePresence>
      {isContextHubOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 350, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="hidden md:flex flex-col bg-secondary/50 border-l border-border/60 h-screen overflow-hidden"
        >
          <div className="flex-1 flex flex-col h-full">
            <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Notes</h2>
                    <Button variant="ghost" size="icon" onClick={toggleContextHub}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex-grow">
                    <NotesTab />
                </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}