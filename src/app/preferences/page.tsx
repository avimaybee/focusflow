
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { getMemory, saveMemory, AiMemory } from '@/lib/memory-actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Check, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const learningStyles = [
  // Foundational
  'Explain concepts simply',
  'Be detailed and thorough',
  'Keep responses concise',
  'Provide real-world examples',
  'Use analogies and metaphors',

  // Structure & Format
  'Use bullet points and lists',
  'Provide structured outlines',
  'Use headings and subheadings',
  'Present information in tables',
  'End with a summary of key points',

  // Interaction & Engagement
  'Ask me questions to check understanding',
  'Use a friendly and encouraging tone',
  'Adopt a formal and academic tone',
  'Challenge my assumptions',
  'Recommend further reading or resources',

  // Content & Media
  'Incorporate historical context',
  'Provide code examples (for technical topics)',
  'Explain the "why" not just the "what"',
  'Focus on practical applications',
  'Use visual descriptions and imagery',
];

export default function PreferencesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [topics, setTopics] = useState<string[]>([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const [preferences, setPreferences] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      getMemory(user.uid)
        .then((memory) => {
          setTopics(memory.topics || []);
          setPreferences(memory.preferences || []);
        })
        .catch((error) => {
          console.error('Failed to load preferences:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not load your preferences.',
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [user, toast]);

  const handleTogglePreference = (pref: string) => {
    setPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleAddTopic = () => {
    if (currentTopic.trim() && !topics.includes(currentTopic.trim())) {
      setTopics([...topics, currentTopic.trim()]);
      setCurrentTopic('');
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setTopics(topics.filter((t) => t !== topicToRemove));
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const memory: AiMemory = { topics, preferences };
      await saveMemory(user.uid, memory);
      toast({
        title: 'Success!',
        description: 'Your preferences have been saved.',
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save your preferences. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">AI Preferences</h1>
      </div>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Topics</CardTitle>
            <CardDescription>
              What topics are you studying? The AI will use these to provide more relevant examples and context.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="e.g., Quantum Physics, The Roman Empire..."
                value={currentTopic}
                onChange={(e) => setCurrentTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
              />
              <Button onClick={handleAddTopic}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {topics.map((topic) => (
                <Badge key={topic} variant="secondary" className="text-sm">
                  {topic}
                  <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleRemoveTopic(topic)} />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Style</CardTitle>
            <CardDescription>
              How do you like to learn? The AI will adapt its communication style to your preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {learningStyles.map((style) => (
                <button
                  key={style}
                  onClick={() => handleTogglePreference(style)}
                  className={cn(
                    'px-4 py-2 border rounded-full text-sm transition-colors flex items-center gap-2',
                    preferences.includes(style)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted/50'
                  )}
                >
                  {preferences.includes(style) && <Check className="h-4 w-4" />}
                  {style}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
