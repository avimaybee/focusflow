'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface Exam {
  title: string;
  questions: {
    questionText: string;
    questionType: 'multiple-choice' | 'short-answer' | 'essay';
    options?: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

interface ExamViewerProps {
  exam: Exam;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (answers: any) => void;
}

export function ExamViewer({ exam, onSubmit }: ExamViewerProps) {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [currentPage, setCurrentPage] = useState(0);

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const currentQuestion = exam.questions[currentPage];

  return (
    <div>
      <h1 className="text-3xl font-bold leading-tight mb-3">{exam.title}</h1>
      <p className="text-muted-foreground mb-10 leading-relaxed">Question {currentPage + 1} of {exam.questions.length}</p>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="leading-tight">{currentQuestion.questionText}</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          {currentQuestion.questionType === 'multiple-choice' && (
            <RadioGroup onValueChange={value => handleAnswerChange(currentPage, value)}>
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-3 py-2">
                  <RadioGroupItem value={option} id={`q${currentPage}-o${index}`} />
                  <Label htmlFor={`q${currentPage}-o${index}`} className="leading-relaxed">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
          {currentQuestion.questionType === 'short-answer' && (
            <Input onChange={e => handleAnswerChange(currentPage, e.target.value)} className="h-11" />
          )}
          {currentQuestion.questionType === 'essay' && (
            <Textarea onChange={e => handleAnswerChange(currentPage, e.target.value)} className="min-h-[200px] leading-relaxed" />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-10">
        <Button 
          onClick={() => setCurrentPage(p => p - 1)} 
          disabled={currentPage === 0} 
          className="h-11 px-6 font-semibold"
          variant="outline"
        >
          ← Previous
        </Button>
        {currentPage < exam.questions.length - 1 ? (
          <Button 
            onClick={() => setCurrentPage(p => p + 1)} 
            className="h-11 px-6 font-semibold"
          >
            Next →
          </Button>
        ) : (
          <Button 
            onClick={() => onSubmit(answers)} 
            className="h-12 px-8 font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200"
          >
            🎯 Submit Exam
          </Button>
        )}
      </div>
    </div>
  );
}
