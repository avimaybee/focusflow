'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useOnboardingModal } from '@/hooks/use-onboarding-modal';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  BrainCircuit,
  FlaskConical,
  Globe,
  Palette,
  MessageSquare,
  ListChecks,
  Pencil,
  X,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { updateUserOnboardingData, getPersonas, Persona } from '@/lib/user-actions';

const subjects = [
    { name: 'Biology', icon: <FlaskConical className="h-5 w-5" /> },
    { name: 'History', icon: <Globe className="h-5 w-5" /> },
    { name: 'Mathematics', icon: <BrainCircuit className="h-5 w-5" /> },
    { name: 'Literature', icon: <BookOpen className="h-5 w-5" /> },
    { name: 'Art', icon: <Palette className="h-5 w-5" /> },
    { name: 'Other', icon: <Pencil className="h-5 w-5" /> },
];

const learningStyles = [
    { name: 'Visual', description: 'Diagrams, charts, and maps', icon: <Palette className="h-6 w-6" /> },
    { name: 'Text', description: 'Summaries and explanations', icon: <MessageSquare className="h-6 w-6" /> },
    { name: 'Interactive', description: 'Quizzes and flashcards', icon: <ListChecks className="h-6 w-6" /> },
];

export const OnboardingModal = () => {
  const { user } = useAuth();
  const { isOpen, onClose } = useOnboardingModal();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const [subject, setSubject] = useState<string>('');
  const [learningStyle, setLearningStyle] = useState<string>('');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string>('neutral');

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      getPersonas().then(setPersonas);
    }
  }, [isOpen]);

  const handleFinish = async () => {
    if (!user || !subject || !learningStyle || !selectedPersona) {
        toast({
            variant: 'destructive',
            title: 'Selection Required',
            description: 'Please make a selection for each step.',
        });
        return;
    }
    setIsSaving(true);
    try {
      await updateUserOnboardingData(user.uid, {
          subject,
          learningStyle,
          preferredPersona: selectedPersona,
          onboardingCompleted: true,
      });
      setStep(4); // Move to success step
      setTimeout(() => {
        onClose();
        // Reset state for next time
        setStep(1);
        setSubject('');
        setLearningStyle('');
        setSelectedPersona('neutral');
      }, 2000);
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
      case 1: // Subject Selection
        return (
          <div>
            <h2 className="text-2xl font-bold mb-2">What are you studying?</h2>
            <p className="text-muted-foreground mb-6">This will help personalize your experience.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {subjects.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setSubject(item.name)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-3 p-4 border rounded-lg transition-all',
                    subject === item.name
                      ? 'border-primary ring-2 ring-primary'
                      : 'hover:border-primary/50'
                  )}
                >
                  {item.icon}
                  <span className="font-medium text-sm">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 2: // Learning Style
        return (
          <div>
            <h2 className="text-2xl font-bold mb-2">How do you learn best?</h2>
            <p className="text-muted-foreground mb-6">Select your style to get a smarter study plan.</p>
            <div className="space-y-4">
              {learningStyles.map((style) => (
                <div
                  key={style.name}
                  onClick={() => setLearningStyle(style.name)}
                  className={cn(
                    'flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all',
                    learningStyle === style.name
                      ? 'border-primary ring-2 ring-primary'
                      : 'hover:border-primary/50'
                  )}
                >
                  <div className="text-primary">{style.icon}</div>
                  <div>
                    <h3 className="font-semibold">{style.name}</h3>
                    <p className="text-xs text-muted-foreground">{style.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 3: // Persona Selection
        return (
            <div>
              <h2 className="text-2xl font-bold mb-2">Choose Your AI Partner</h2>
              <p className="text-muted-foreground mb-6">Select a default persona. You can always change this later.</p>
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
      
      <div className="flex justify-between items-center p-6 bg-muted/50 border-t">
        <div className="flex gap-2">
            {[1,2,3].map(i => (
                <div key={i} className={cn("h-2 w-2 rounded-full", step >= i ? 'bg-primary' : 'bg-border')} />
            ))}
        </div>
        <div className="flex justify-end gap-4">
          {step > 1 && step < 4 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
          {step === 1 && <Button onClick={() => setStep(step + 1)} disabled={!subject}>Next <ArrowRight className="h-4 w-4 ml-2" /></Button>}
          {step === 2 && <Button onClick={() => setStep(step + 1)} disabled={!learningStyle}>Next <ArrowRight className="h-4 w-4 ml-2" /></Button>}
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
