
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { generateAndSaveExam } from '@/lib/exam-actions';
import { Loader2, Lightbulb, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const topicExamples = [
  'The American Revolution',
  'Calculus: Derivatives and Integrals',
  'Introduction to Python Programming',
  'World War II: European Theater',
  'Cellular Biology: Photosynthesis',
];

export default function NewPracticeExamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">('medium');
  const [questionTypes, setQuestionTypes] = useState<("multiple-choice" | "short-answer" | "essay")[]>(['multiple-choice']);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateExam = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create an exam.' });
      return;
    }
    if (!topic.trim() || questionTypes.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all fields.' });
      return;
    }

    setIsGenerating(true);
    try {
      const examId = await generateAndSaveExam(user.id, {
        topic,
        questionCount,
        difficulty,
        questionTypes,
      });
      toast({ title: 'Success!', description: 'Your practice exam has been generated.' });
      router.push(`/practice-exam/${examId}`);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not generate the exam.' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3 leading-tight">Create a Practice Exam</h1>
        <p className="text-muted-foreground leading-relaxed">
          Configure your practice exam settings below and let AI generate questions for you. Get instant feedback and track your progress.
        </p>
      </div>

      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Topic Examples</h3>
              <div className="flex flex-wrap gap-2">
                {topicExamples.map((example) => (
                  <Button
                    key={example}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setTopic(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click any example to use it, or type your own topic below.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="topic" className="font-semibold">Topic</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Be specific about what you want to study. Include the course name, chapter, or specific concepts.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input 
            id="topic" 
            value={topic} 
            onChange={e => setTopic(e.target.value)} 
            placeholder="e.g., The American Revolution" 
            className="h-11" 
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="question-count" className="font-semibold">Number of Questions</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Choose between 5-50 questions. More questions = longer exam. Typical exams have 10-20 questions.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input 
            id="question-count" 
            type="number" 
            min={5}
            max={50}
            value={questionCount} 
            onChange={e => setQuestionCount(Number(e.target.value))} 
            className="h-11" 
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="difficulty" className="font-semibold">Difficulty</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Easy: Basic recall questions. Medium: Application and analysis. Hard: Advanced synthesis and evaluation.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select value={difficulty} onValueChange={(value: "easy" | "medium" | "hard") => setDifficulty(value)}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy - Basic Concepts</SelectItem>
              <SelectItem value="medium">Medium - Applied Knowledge</SelectItem>
              <SelectItem value="hard">Hard - Advanced Analysis</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Label className="font-semibold">Question Types</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Select at least one type. Multiple choice is best for quick practice. Short answer and essays test deeper understanding.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex flex-col gap-3">
            {([
              { value: 'multiple-choice', label: 'Multiple Choice', description: 'Choose from 4 options' },
              { value: 'short-answer', label: 'Short Answer', description: 'Write a brief response' },
              { value: 'essay', label: 'Essay', description: 'Detailed written answer' }
            ] as const).map(type => (
              <div key={type.value} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  id={type.value}
                  checked={questionTypes.includes(type.value)}
                  onCheckedChange={checked => {
                    if (checked) {
                      setQuestionTypes(prev => [...prev, type.value]);
                    } else {
                      setQuestionTypes(prev => prev.filter(t => t !== type.value));
                    }
                  }}
                />
                <div className="flex-1">
                  <Label htmlFor={type.value} className="font-medium cursor-pointer block">{type.label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button 
          onClick={handleGenerateExam} 
          disabled={isGenerating} 
          size="lg" 
          className="w-full h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200 mt-8"
        >
          {isGenerating ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Your Exam...</> : '🎯 Generate Practice Exam'}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Your exam will be saved to My Content and available for practice anytime.
        </p>
      </div>
    </div>
  );
}
