
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

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
  const [showResults, setShowResults] = useState(false);

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return <p>No quiz available.</p>;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const selectedAnswer = selectedAnswers[currentQuestionIndex];
  const isQuestionAnswered = !!selectedAnswer;

  const handleAnswerSelect = (answer: string) => {
    if (isQuestionAnswered) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestionIndex]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    return quiz.questions.reduce((score, question, index) => {
      return selectedAnswers[index] === question.correctAnswer ? score + 1 : score;
    }, 0);
  };
  
  if (showResults) {
    const score = calculateScore();
    return (
      <Card className="w-full max-w-lg mx-auto my-4">
        <CardHeader className="text-center">
          <CardTitle>Quiz Results: {quiz.title}</CardTitle>
          <CardDescription>You scored {score} out of {quiz.questions.length}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {quiz.questions.map((q, i) => (
            <div key={i} className="p-3 rounded-lg bg-secondary/50">
                <p className="font-semibold">{i + 1}. {q.questionText}</p>
                {selectedAnswers[i] === q.correctAnswer ? (
                    <p className="text-sm text-green-400 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Correct!</p>
                ) : (
                    <>
                        <p className="text-sm text-red-400 flex items-center gap-2"><XCircle className="h-4 w-4" /> Incorrect.</p>
                        <p className="text-xs text-muted-foreground">Your answer: {selectedAnswers[i] || 'Not answered'}</p>
                        <p className="text-xs text-muted-foreground">Correct answer: {q.correctAnswer}</p>
                    </>
                )}
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button onClick={() => { setShowResults(false); setSelectedAnswers({}); setCurrentQuestionIndex(0); }} className="w-full">
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto my-4">
      <CardHeader>
        <CardTitle>{quiz.title}</CardTitle>
        <CardDescription>
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-semibold mb-4">{currentQuestion.questionText}</p>
        <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect} disabled={isQuestionAnswered}>
          {currentQuestion.options.map((option, index) => {
            const isCorrect = option === currentQuestion.correctAnswer;
            const isSelected = option === selectedAnswer;
            return (
                <div 
                    key={index} 
                    className={cn("flex items-center space-x-3 p-3 rounded-md border transition-colors",
                        isQuestionAnswered && isCorrect && "border-green-500 bg-green-500/10",
                        isQuestionAnswered && isSelected && !isCorrect && "border-red-500 bg-red-500/10",
                    )}
                >
                  <RadioGroupItem value={option} id={`q${currentQuestionIndex}-opt${index}`} />
                  <Label htmlFor={`q${currentQuestionIndex}-opt${index}`} className="flex-1 cursor-pointer">{option}</Label>
                </div>
            );
          })}
        </RadioGroup>
        <AnimatePresence>
        {isQuestionAnswered && (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-md bg-secondary/50 border"
            >
                <h4 className="font-semibold text-sm">Explanation</h4>
                <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
            </motion.div>
        )}
        </AnimatePresence>
      </CardContent>
       <CardFooter className="justify-end">
          <Button onClick={handleNext} disabled={!isQuestionAnswered}>
            {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          </Button>
       </CardFooter>
    </Card>
  );
}
