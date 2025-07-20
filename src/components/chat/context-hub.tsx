'use client';

import { NotesTab } from './notes-tab';

export const ContextHub = () => {
  return (
    <div className="p-4 h-full flex flex-col">
      <NotesTab />
    </div>
  );
};

