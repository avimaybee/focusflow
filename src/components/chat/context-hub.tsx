'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrainCircuit, Notebook } from 'lucide-react';
import { NotesTab } from './notes-tab'; // We will create this next
import { AiMemoryTab } from './ai-memory-tab'; // We will create this next

export const ContextHub = () => {
  return (
    <div className="p-4 h-full flex flex-col">
      <Tabs defaultValue="ai-memory" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai-memory">
            <BrainCircuit className="h-4 w-4 mr-2" />
            AI Memory
          </TabsTrigger>
          <TabsTrigger value="notes">
            <Notebook className="h-4 w-4 mr-2" />
            My Notes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="ai-memory" className="flex-grow mt-4">
          <AiMemoryTab />
        </TabsContent>
        <TabsContent value="notes" className="flex-grow mt-4">
          <NotesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
