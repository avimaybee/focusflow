'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Check, MessageSquare, Users, Sparkles, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to FocusFlow! 🎉',
    description: 'Your AI co-pilot for learning is ready to help you study smarter.',
    icon: Rocket,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          FocusFlow uses advanced AI to help you understand complex topics, create study materials, 
          and ace your exams. Let's take a quick tour!
        </p>
        <div className="grid gap-3 mt-6">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Smart Conversations</p>
              <p className="text-xs text-muted-foreground">Chat naturally with AI tutors</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Users className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Multiple Personas</p>
              <p className="text-xs text-muted-foreground">Switch between specialized AI teachers</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Smart Tools</p>
              <p className="text-xs text-muted-foreground">Generate summaries, quizzes, and flashcards</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'chat',
    title: 'Start a Conversation',
    description: 'Ask questions, explain concepts, or request study materials.',
    icon: MessageSquare,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          The chat interface is where the magic happens. Simply type your question or request, 
          and our AI will help you understand any topic.
        </p>
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Try asking:</p>
          <div className="space-y-2">
            <div className="p-2 rounded bg-muted/50 text-sm">
              "Explain quantum mechanics in simple terms"
            </div>
            <div className="p-2 rounded bg-muted/50 text-sm">
              "Create a summary of the French Revolution"
            </div>
            <div className="p-2 rounded bg-muted/50 text-sm">
              "Generate a quiz on photosynthesis"
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Pro tip:</strong> The more specific your question, 
            the better the response!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'personas',
    title: 'Choose Your AI Tutor',
    description: 'Different personas specialize in different teaching styles.',
    icon: Users,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Each persona has a unique personality and teaching approach. Switch between them 
          to find the one that works best for you.
        </p>
        <div className="space-y-3">
          <div className="p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-bold">G</span>
              </div>
              <div>
                <p className="font-medium text-sm">Gurt (Default)</p>
                <p className="text-xs text-muted-foreground">Friendly and encouraging</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground ml-10">
              Great for general questions and building confidence
            </p>
          </div>
          <div className="p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-sm font-bold">S</span>
              </div>
              <div>
                <p className="font-medium text-sm">Socratic Mentor</p>
                <p className="text-xs text-muted-foreground">Asks guiding questions</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground ml-10">
              Perfect for deep understanding through inquiry
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Click the persona menu in chat to explore all available tutors and their specialties.
        </p>
      </div>
    ),
  },
  {
    id: 'tools',
    title: 'Unlock Smart Tools',
    description: 'Transform any message into study materials instantly.',
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Every AI response comes with Smart Tools – one-click actions to rewrite, 
          summarize, or create study materials from the content.
        </p>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-medium mb-3">Available Smart Tools:</p>
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                <Sparkles className="h-3 w-3" />
              </div>
              <span className="text-muted-foreground">Rewrite Text</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                <Sparkles className="h-3 w-3" />
              </div>
              <span className="text-muted-foreground">Convert to Bullet Points</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                <Sparkles className="h-3 w-3" />
              </div>
              <span className="text-muted-foreground">Find Counterarguments</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                <Sparkles className="h-3 w-3" />
              </div>
              <span className="text-muted-foreground">Create Presentation Outline</span>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Look for the sparkle icon next to AI messages to access Smart Tools!
          </p>
        </div>
      </div>
    ),
  },
];

const ONBOARDING_STORAGE_KEY = 'focusflow_onboarding_completed';

export function OnboardingModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [direction, setDirection] = React.useState<'forward' | 'backward'>('forward');

  React.useEffect(() => {
    // Check if user has completed onboarding
    const hasCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!hasCompleted) {
      // Small delay to let the page load first
      setTimeout(() => setIsOpen(true), 500);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setDirection('forward');
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection('backward');
      setCurrentStep(currentStep - 1);
    }
  };

  const step = onboardingSteps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[520px] max-w-[95vw] p-0 overflow-hidden border-border/60">
        <DialogHeader className="p-6 pb-4 relative">
          <div className="flex items-start justify-between pr-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-bold">{step.title}</DialogTitle>
                <p className="text-sm text-foreground/70 mt-1 font-medium">{step.description}</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step.id}
              custom={direction}
              initial={{
                opacity: 0,
                x: direction === 'forward' ? 20 : -20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: direction === 'forward' ? -20 : 20,
              }}
              transition={{
                duration: 0.2,
                ease: 'easeInOut',
              }}
            >
              {step.content}
            </motion.div>
          </AnimatePresence>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 mt-8 mb-6">
            {onboardingSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentStep ? 'forward' : 'backward');
                  setCurrentStep(index);
                }}
                className={cn(
                  'h-2 rounded-full transition-all',
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                )}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-foreground/70 hover:text-foreground font-medium"
            >
              Skip Tour
            </Button>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  size="sm"
                  className="font-semibold"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button onClick={handleNext} size="sm" className="font-semibold">
                {isLastStep ? (
                  <>
                    Get Started
                    <Check className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
