
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useOnboardingModal } from '@/hooks/use-onboarding-modal';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Check,
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { UsernameInput } from './username-input';
import { updateUserProfile } from '@/lib/user-actions';
import { getPersonas } from '@/lib/user-actions';
import type { Persona } from '@/types/chat-types';

export const OnboardingModal = () => {
  const { user, username: initialUsername, publicProfile } = useAuth();
  const { isOpen, onClose } = useOnboardingModal();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [learningGoals, setLearningGoals] = useState('');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string>('neutral');

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      getPersonas().then((data) => setPersonas(data as unknown as Persona[]));
      setUsername(initialUsername || '');
      setLearningGoals(publicProfile?.learningGoals || '');
      setSelectedPersona(publicProfile?.preferredPersona || 'neutral');
    }
  }, [isOpen, initialUsername, publicProfile]);

  const handleFinish = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not Logged In' });
        return;
    }
    if (usernameStatus === 'taken' && username !== initialUsername) {
        toast({ variant: 'destructive', title: 'Invalid Username' });
        return;
    }
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, {
          username: username || undefined,
          learningGoals,
          preferredPersona: selectedPersona,
          onboardingCompleted: true,
      });
      setStep(4); // Move to success step
      setTimeout(() => {
        onClose();
        // Reset to step 1 for the next time it opens
        setTimeout(() => setStep(1), 300);
      }, 2000);
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save your preferences.' });
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: // Username
        return (
          <div>
            <h2 className="text-2xl font-bold mb-2">Create your username</h2>
            <p className="text-muted-foreground mb-6">This will be your unique handle on FocusFlow AI for sharing content.</p>
            <UsernameInput 
              value={username}
              onChange={setUsername}
              initialUsername={initialUsername || ''}
              onStatusChange={setUsernameStatus}
            />
          </div>
        );
      case 2: // Learning Goals
        return (
          <div>
            <h2 className="text-2xl font-bold mb-2">What are your learning goals?</h2>
            <p className="text-muted-foreground mb-6">This helps the AI understand your objectives. You can skip this for now.</p>
            <Textarea
              value={learningGoals}
              onChange={(e) => setLearningGoals(e.target.value)}
              placeholder="e.g., 'Master calculus', 'Learn to code in Python', 'Prepare for my history exam'"
              className="min-h-[100px] bg-background"
            />
          </div>
        );
      case 3: // Persona Selection
        return (
            <div>
              <h2 className="text-2xl font-bold mb-2">Choose Your AI Partner</h2>
              <p className="text-muted-foreground mb-6">Select a default personality for your AI. You can always change this later.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2">
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
              </div>
            </div>
          );
      case 4: // Success
        return (
            <div className="text-center py-8">
                <div className="inline-block p-4 bg-green-500/20 rounded-full mb-4">
                    <Check className="h-10 w-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">All Set!</h2>
                <p className="text-muted-foreground">Your profile is ready. Let&apos;s start learning.</p>
            </div>
        )
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg" showCloseButton={step < 4}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="p-6"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
      
      {step < 4 && (
        <div className="flex justify-between items-center p-6 bg-muted/50 border-t">
          <div className="flex gap-2">
              {[1,2,3].map(i => (
                  <div key={i} className={cn("h-2 w-2 rounded-full", step >= i ? 'bg-primary' : 'bg-border')} />
              ))}
          </div>
          <div className="flex justify-end gap-4">
            {step > 1 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
            {step < 3 && <Button onClick={() => setStep(step + 1)} disabled={step === 1 && (usernameStatus === 'taken' || !username)}>Next <ArrowRight className="h-4 w-4 ml-2" /></Button>}
            {step === 3 && (
              <Button onClick={handleFinish} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Finish Setup'}
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
