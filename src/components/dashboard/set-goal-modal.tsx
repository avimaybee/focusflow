'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { setGoal } from '@/lib/dashboard-actions';
import { startOfWeek, format } from 'date-fns';

interface SetGoalModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
}

export function SetGoalModal({ isOpen, onOpenChange, onSuccess }: SetGoalModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [targetHours, setTargetHours] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!user || !subject.trim() || !targetHours) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all fields.' });
      return;
    }

    setIsSaving(true);
    try {
      const weekStartDate = format(startOfWeek(new Date()), 'yyyy-MM-dd');
      await setGoal(user.id, {
        subject: subject.trim(),
        targetHours: Number(targetHours),
        weekStartDate,
      });
      toast({ title: 'Success!', description: 'Your goal has been set.' });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not set your goal.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-w-[95vw] p-0 overflow-hidden border-border/60">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-bold">Set a Weekly Goal</DialogTitle>
          <DialogDescription className="text-foreground/70 font-medium">
            Define a target for a subject you want to focus on this week.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium">
                Subject
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Biology"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-hours" className="text-sm font-medium">
                Target (Hours)
              </Label>
              <Input
                id="target-hours"
                type="number"
                value={targetHours}
                onChange={(e) => setTargetHours(e.target.value)}
                placeholder="e.g., 5"
                className="bg-background"
              />
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Goal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
