
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
import { Loader2 } from 'lucide-react';

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
    <div className="container mx-auto py-10 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create a Practice Exam</h1>
      <div className="space-y-6">
        <div>
          <Label htmlFor="topic">Topic</Label>
          <Input id="topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., The American Revolution" />
        </div>
        <div>
          <Label htmlFor="question-count">Number of Questions</Label>
          <Input id="question-count" type="number" value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} />
        </div>
        <div>
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select value={difficulty} onValueChange={(value: "easy" | "medium" | "hard") => setDifficulty(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Question Types</Label>
          <div className="flex items-center gap-4 mt-2">
            {(['multiple-choice', 'short-answer', 'essay'] as const).map(type => (
              <div key={type} className="flex items-center gap-2">
                <Checkbox
                  id={type}
                  checked={questionTypes.includes(type)}
                  onCheckedChange={checked => {
                    if (checked) {
                      setQuestionTypes(prev => [...prev, type]);
                    } else {
                      setQuestionTypes(prev => prev.filter(t => t !== type));
                    }
                  }}
                />
                <Label htmlFor={type}>{type.replace('-', ' ')}</Label>
              </div>
            ))}
          </div>
        </div>
        <Button onClick={handleGenerateExam} disabled={isGenerating}>
          {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Generate Exam'}
        </Button>
      </div>
    </div>
  );
}
