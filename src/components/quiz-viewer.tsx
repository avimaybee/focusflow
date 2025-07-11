'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Quiz {
  title: string;
  questions: Question[];
}

interface QuizViewerProps {
  quiz: Quiz;
}

export function QuizViewer({ quiz }: QuizViewerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return <p>No quiz available.</p>;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const selectedAnswer = selectedAnswers[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestionIndex]: answer }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };
  
  const calculateScore = () => {
    return quiz.questions.reduce((score, question, index) => {
      return selectedAnswers[index] === question.correctAnswer ? score + 1 : score;
    }, 0);
  };

  if (isSubmitted) {
    const score = calculateScore();
    return (
      <Card className="w-full max-w-lg mx-auto my-4">
        <CardHeader>
          <CardTitle>Quiz Results: {quiz.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-2xl font-bold">
            You scored {score} out of {quiz.questions.length}
          </p>
          <Button onClick={() => { setIsSubmitted(false); setSelectedAnswers({}); setCurrentQuestionIndex(0); }} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto my-4">
      <CardHeader>
        <CardTitle>{quiz.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </p>
      </CardHeader>
      <CardContent>
        <p className="font-semibold mb-4">{currentQuestion.questionText}</p>
        <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
          {currentQuestion.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value={option} id={`q${currentQuestionIndex}-opt${index}`} />
              <Label htmlFor={`q${currentQuestionIndex}-opt${index}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleNext} disabled={!selectedAnswer}>
            {currentQuestionIndex < quiz.questions.length - 1 ? 'Next' : 'Submit'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}