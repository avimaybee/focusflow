'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useOnboardingModal } from '@/hooks/use-onboarding-modal';
import { saveMemory, AiMemory } from '@/lib/memory-actions';
import { getPersonas, updateUserPersona, Persona } from '@/lib/user-actions';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

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

export const OnboardingModal = () => {
  const { user } = useAuth();
  const { isOpen, onClose } = useOnboardingModal();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const [topics, setTopics] = useState<string[]>([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const [preferences, setPreferences] = useState<string[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string>('neutral');

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      getPersonas().then(setPersonas);
    }
  }, [isOpen]);

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

  const handleFinish = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const memory: AiMemory = { topics, preferences };
      await Promise.all([
        saveMemory(user.uid, memory),
        updateUserPersona(user.uid, selectedPersona),
        updateDoc(doc(db, 'users', user.uid), { onboardingCompleted: true })
      ]);
      setStep(4); 
      setTimeout(() => {
        onClose();
        // Reset state for next time
        setStep(1);
        setTopics([]);
        setPreferences([]);
        setSelectedPersona('neutral');
      }, 2000); // Close after 2 seconds
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save your preferences. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: // Welcome & Topics
        return (
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome to FocusFlow AI!</h2>
            <p className="text-muted-foreground mb-6">Let's personalize your experience. First, what topics are you studying right now?</p>
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
          </div>
        );
      case 2: // Learning Style
        return (
          <div>
            <h2 className="text-2xl font-bold mb-2">How do you like to learn?</h2>
            <p className="text-muted-foreground mb-6">Select your preferences. The AI will adapt to your style.</p>
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
          </div>
        );
      case 3: // Persona Selection
        return (
            <div>
              <h2 className="text-2xl font-bold mb-2">Choose Your AI Partner</h2>
              <p className="text-muted-foreground mb-6">Select a default persona for your new chats. You can always change this later.</p>
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
                <p className="text-muted-foreground">Your preferences have been saved. Let's start learning.</p>
            </div>
        )
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl" showCloseButton={step < 4}>
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
      
      <div className="flex justify-between items-center p-6 bg-muted/50 border-t">
        <div className="flex gap-2">
            {[1,2,3].map(i => (
                <div key={i} className={cn("h-2 w-2 rounded-full", step >= i ? 'bg-primary' : 'bg-border')} />
            ))}
        </div>
        <div className="flex justify-end gap-4">
          {step > 1 && step < 4 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
          {step < 3 && <Button onClick={() => setStep(step + 1)}>Next <ArrowRight className="h-4 w-4 ml-2" /></Button>}
          {step === 3 && (
            <Button onClick={handleFinish} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Finish Setup'}
            </Button>
          )}
          {step === 4 && <Button onClick={onClose}>Get Started <Sparkles className="h-4 w-4 ml-2" /></Button>}
        </div>
      </div>
    </Modal>
  );
};
