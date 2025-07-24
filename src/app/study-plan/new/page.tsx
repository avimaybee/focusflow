
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
// This will be a new server action
import { generateAndSaveStudyPlan } from '@/lib/plan-actions';

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
      const planId = await generateAndSaveStudyPlan(user.uid, {
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

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create a Study Plan</h1>
      <div className="space-y-6">
        <div>
          <Label htmlFor="topic">Topic / Subject</Label>
          <Input id="topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., World History" />
        </div>
        <div>
          <Label htmlFor="duration">Duration (in days)</Label>
          <Input id="duration" type="number" value={durationDays} onChange={e => setDurationDays(Number(e.target.value))} />
        </div>
        <div>
          <Label htmlFor="exam-date">Exam Date (Optional)</Label>
          <Input id="exam-date" type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="syllabus">Syllabus / Topics (Optional)</Label>
          <Textarea id="syllabus" value={syllabus} onChange={e => setSyllabus(e.target.value)} placeholder="Paste your syllabus or a list of topics here..." className="min-h-[150px]" />
        </div>
        <Button onClick={handleGeneratePlan} disabled={isGenerating}>
          {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Generate Plan'}
        </Button>
      </div>
    </div>
  );
}
