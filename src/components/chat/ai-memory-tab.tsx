'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { getMemory, saveMemory, AiMemory } from '@/lib/memory-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

const MemoryItem = ({ text, onEdit, onDelete }) => (
  <div className="group flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
    <span className="text-sm text-foreground/80">{text}</span>
    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

export const AiMemoryTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [memory, setMemory] = useState<AiMemory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newTopic, setNewTopic] = useState('');
  const [newPreference, setNewPreference] = useState('');

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      getMemory(user.uid)
        .then(setMemory)
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  const handleSave = async (newMemory: AiMemory) => {
    if (!user) return;
    try {
      await saveMemory(user.uid, newMemory);
      setMemory(newMemory);
      toast({ title: 'Memory updated!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update memory.' });
    }
  };

  const handleAddTopic = () => {
    if (newTopic.trim() && memory) {
      const updatedTopics = [...memory.topics, newTopic.trim()];
      handleSave({ ...memory, topics: updatedTopics });
      setNewTopic('');
    }
  };

  const handleAddPreference = () => {
    if (newPreference.trim() && memory) {
      const updatedPreferences = [...memory.preferences, newPreference.trim()];
      handleSave({ ...memory, preferences: updatedPreferences });
      setNewPreference('');
    }
  };

  const handleDeleteTopic = (topicToDelete: string) => {
    if (memory) {
      const updatedTopics = memory.topics.filter(t => t !== topicToDelete);
      handleSave({ ...memory, topics: updatedTopics });
    }
  };
  
  const handleDeletePreference = (preferenceToDelete: string) => {
    if (memory) {
      const updatedPreferences = memory.preferences.filter(p => p !== preferenceToDelete);
      handleSave({ ...memory, preferences: updatedPreferences });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="h-full flex flex-col">
      <p className="text-sm text-muted-foreground mb-4">
        The AI remembers these topics and preferences to personalize your conversations.
      </p>
      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Key Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {memory?.topics.map((topic) => (
                <Badge key={topic} variant="secondary" className="group">
                  {topic}
                  <Trash2 className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 cursor-pointer" onClick={() => handleDeleteTopic(topic)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Input value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder="Add a new topic..." />
              <Button size="icon" onClick={handleAddTopic}><Plus className="h-4 w-4"/></Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your Preferences</CardTitle>
          </CardHeader>
          <CardContent>
             {memory?.preferences.map((pref) => (
                <MemoryItem
                  key={pref}
                  text={pref}
                  onEdit={() => alert('Editing not implemented yet.')}
                  onDelete={() => handleDeletePreference(pref)}
                />
              ))}
            <div className="flex gap-2 mt-4">
              <Input value={newPreference} onChange={(e) => setNewPreference(e.target.value)} placeholder="Add a new preference..." />
              <Button size="icon" onClick={handleAddPreference}><Plus className="h-4 w-4"/></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
