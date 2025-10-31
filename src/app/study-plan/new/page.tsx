
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lightbulb, HelpCircle, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
// This will be a new server action
import { generateAndSaveStudyPlan } from '@/lib/plan-actions';

const topicExamples = [
  { topic: 'World History', duration: 14, syllabus: 'Ancient civilizations\nMedieval period\nRenaissance\nModern era' },
  { topic: 'AP Biology', duration: 30, syllabus: 'Cell structure\nEvolution\nGenetics\nEcosystems' },
  { topic: 'Calculus I', duration: 21, syllabus: 'Limits\nDerivatives\nIntegrals\nApplications' },
];

const durationPresets = [
  { label: '1 Week', days: 7 },
  { label: '2 Weeks', days: 14 },
  { label: '1 Month', days: 30 },
  { label: '2 Months', days: 60 },
];

export default function NewStudyPlanPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [examDate, setExamDate] = useState('');
  const [syllabus, setSyllabus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePlan = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create a plan.' });
      return;
    }
    if (!topic.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please provide a topic.' });
      return;
    }

    setIsGenerating(true);
    try {
      const planId = await generateAndSaveStudyPlan(user.id, {
        topic,
        durationDays,
        examDate,
        syllabus,
      });
      toast({ title: 'Success!', description: 'Your study plan has been generated.' });
      router.push(`/study-plan/${planId}`);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not generate the plan.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const loadExample = (example: typeof topicExamples[0]) => {
    setTopic(example.topic);
    setDurationDays(example.duration);
    setSyllabus(example.syllabus);
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3 leading-tight">Create a Study Plan</h1>
        <p className="text-muted-foreground leading-relaxed">
          Fill out the form below and let AI create a personalized, day-by-day study plan tailored to your timeline and goals.
        </p>
      </div>

      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Quick Start Examples</h3>
              <div className="flex flex-wrap gap-2">
                {topicExamples.map((example) => (
                  <Button
                    key={example.topic}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => loadExample(example)}
                  >
                    {example.topic}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click any example to pre-fill the form with sample data you can modify.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="topic" className="font-semibold">Topic / Subject</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>The main subject you want to study. Be specific - "AP Biology" is better than just "Biology".</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input 
            id="topic" 
            value={topic} 
            onChange={e => setTopic(e.target.value)} 
            placeholder="e.g., World History or AP Biology" 
            className="h-11" 
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="duration" className="font-semibold">Duration (in days)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>How many days until your exam or deadline? The AI will break down topics across this timeline.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              {durationPresets.map((preset) => (
                <Button
                  key={preset.days}
                  variant={durationDays === preset.days ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDurationDays(preset.days)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Input 
              id="duration" 
              type="number" 
              min={1}
              max={365}
              value={durationDays} 
              onChange={e => setDurationDays(Number(e.target.value))} 
              className="h-11" 
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="exam-date" className="font-semibold">Exam Date (Optional)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Setting an exam date helps the AI create a more focused plan with increasing intensity as the date approaches.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input 
              id="exam-date" 
              type="date" 
              value={examDate} 
              onChange={e => setExamDate(e.target.value)} 
              className="h-11 pl-10" 
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="syllabus" className="font-semibold">Syllabus / Topics (Optional)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>List the topics you need to cover, one per line. The AI will distribute these across your study timeline.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Textarea 
            id="syllabus" 
            value={syllabus} 
            onChange={e => setSyllabus(e.target.value)} 
            placeholder="List topics you need to cover (one per line):&#10;• Introduction to the topic&#10;• Key concepts&#10;• Advanced applications&#10;• Review and practice" 
            className="min-h-[150px] leading-relaxed font-mono text-sm" 
          />
          <p className="text-xs text-muted-foreground mt-1">
            The more specific you are, the better your personalized plan will be.
          </p>
        </div>

        <Button 
          onClick={handleGeneratePlan} 
          disabled={isGenerating} 
          size="lg" 
          className="w-full h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200 mt-8"
        >
          {isGenerating ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Your Plan...</> : '🚀 Generate Study Plan'}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Your personalized study plan will be saved to My Content and can be edited anytime.
        </p>
      </div>
    </div>
  );
}
