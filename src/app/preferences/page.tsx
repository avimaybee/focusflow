
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPersonas, Persona, updateUserProfile, getUserProfile } from '@/lib/user-actions';

export default function PreferencesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [learningGoals, setLearningGoals] = useState('');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string>('');

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      Promise.all([
        getUserProfile(user.uid),
        getPersonas(),
      ]).then(([profile, personasData]) => {
        setLearningGoals(profile.learningGoals || '');
        setSelectedPersona(profile.preferredPersona || 'neutral');
        setPersonas(personasData);
      }).catch((error) => {
        console.error('Failed to load preferences:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load your preferences.',
        });
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [user, toast]);

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, {
        learningGoals,
        preferredPersona: selectedPersona,
      });
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
            <CardTitle>Learning Goals</CardTitle>
            <CardDescription>
              What do you want to achieve? This will help the AI understand your objectives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g., 'Master calculus', 'Learn to code in Python', 'Prepare for my history exam'"
              value={learningGoals}
              onChange={(e) => setLearningGoals(e.target.value)}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Persona</CardTitle>
            <CardDescription>
              Choose a personality for your AI partner.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personas.map((persona) => (
              <div
                key={persona.id}
                onClick={() => setSelectedPersona(persona.id)}
                className={cn(
                  'p-4 border rounded-lg cursor-pointer transition-all',
                  selectedPersona === persona.id ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'
                )}
              >
                <h3 className="font-semibold">{persona.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{persona.description}</p>
              </div>
            ))}
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
