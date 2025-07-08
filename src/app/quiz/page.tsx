'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { handleCreateQuiz } from './actions';
import { CreateQuizOutput } from '@/ai/flows/create-quiz';
import {
  Loader2,
  Share2,
  Sparkles,
  FileText,
  Upload,
  X,
  Paperclip,
  ClipboardCheck,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  BookCopy,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Label } from '@/components/ui/label';

const quizFormSchema = z.object({
  notes: z.string(), // Validation is handled in onSubmit
});

type QuizFormValues = z.infer<typeof quizFormSchema>;

type QuizState = 'generating' | 'in-progress' | 'finished' | 'idle';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export default function QuizPage() {
  const [quizData, setQuizData] = useState<CreateQuizOutput | null>(null);
  const [quizState, setQuizState] = useState<QuizState>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [lastSuccessfulInput, setLastSuccessfulInput] = useState<string | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: { notes: '' },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a PDF file.',
        });
        return;
      }
      setSelectedFile(file);
      form.setValue('notes', file.name);
      form.clearErrors('notes');
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    form.setValue('notes', '');
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const onSubmit = useCallback(async (data: QuizFormValues) => {
    setQuizState('generating');
    setQuizData(null);
    setLastSuccessfulInput(null);
    let notesInput: string;
    try {
      if (selectedFile) {
        notesInput = await fileToDataUri(selectedFile);
      } else {
        notesInput = data.notes;
        const isDataUri = notesInput.startsWith('data:');
        if (!isDataUri && notesInput.length < 50) {
          form.setError('notes', { type: 'manual', message: 'Please enter at least 50 characters.' });
          setQuizState('idle');
          return;
        }
      }
      const result = await handleCreateQuiz({ notes: notesInput });
      if (result && result.questions.length > 0) {
        setQuizData(result);
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setSelectedAnswer(null);
        setFeedback(null);
        setQuizState('in-progress');
        setLastSuccessfulInput(notesInput);
      } else {
        toast({ variant: 'destructive', title: 'Quiz Generation Failed', description: 'Could not generate a quiz. Please try again with different content.' });
        setQuizState('idle');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Something went wrong.' });
      setQuizState('idle');
    }
  }, [form, toast, selectedFile]);

  useEffect(() => {
    const notesFromStorage = sessionStorage.getItem('focusflow-notes-for-next-step');
    if (notesFromStorage) {
      sessionStorage.removeItem('focusflow-notes-for-next-step');
      form.setValue('notes', notesFromStorage);
      form.handleSubmit(onSubmit)();
    }
  }, [form, onSubmit]);
  
  const handleAnswerSubmit = () => {
    if (!selectedAnswer || !quizData) return;
    const currentQuestion = quizData.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setUserAnswers([...userAnswers, selectedAnswer]);
  };

  const handleNextQuestion = () => {
    if (!quizData) return;
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setFeedback(null);
    } else {
      setQuizState('finished');
    }
  };
  
  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setSelectedAnswer(null);
    setFeedback(null);
    setQuizState('in-progress');
  }

  const createNewQuiz = () => {
    setQuizData(null);
    setQuizState('idle');
    form.reset();
    clearFile();
  }

  const score = useMemo(() => {
    if (!quizData) return 0;
    return userAnswers.reduce((correctCount, answer, index) => {
      if (quizData.questions[index].correctAnswer === answer) {
        return correctCount + 1;
      }
      return correctCount;
    }, 0);
  }, [userAnswers, quizData]);

  const shareQuiz = () => {
    const shareUrl = `https://focusflow.ai/quiz/set/${Date.now()}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Share Link Copied!',
      description: 'A public link to this quiz has been copied to your clipboard.',
    });
  };

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="text-center mb-12">
        <ClipboardCheck className="mx-auto h-12 w-12 text-primary" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold mt-4">AI Practice Quiz Generator</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Test your knowledge by turning your notes into a practice quiz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><FileText className="h-6 w-6" /> Your Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => {
                    const isImportedPdf = field.value.startsWith('data:application/pdf;base64,');
                    return (
                    <FormItem>
                      <FormLabel>Paste your text or upload a PDF</FormLabel>
                       {selectedFile && (
                        <div className="flex items-center justify-between text-sm p-2 bg-muted rounded-md border">
                          <div className="flex items-center gap-2 truncate">
                              <Paperclip className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{selectedFile.name}</span>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={clearFile}><X className="h-4 w-4"/></Button>
                        </div>
                       )}
                       {isImportedPdf && !selectedFile && (
                            <div className="flex items-center justify-between text-sm p-2 bg-muted rounded-md border">
                                <div className="flex items-center gap-2 truncate">
                                    <Paperclip className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">Notes imported from previous step</span>
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => form.setValue('notes', '')}>
                                    <X className="h-4 w-4"/>
                                </Button>
                            </div>
                        )}
                      <FormControl>
                        <Textarea placeholder="Type or paste your notes here..." className={cn("min-h-[300px] resize-y", { 'hidden': isImportedPdf && !selectedFile })} {...field} onChange={(e) => {field.onChange(e); if (selectedFile) setSelectedFile(null); }} disabled={!!selectedFile}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    );
                  }}
                />
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden"/>
                 <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Upload PDF</Button>
                <Button type="submit" className="w-full" disabled={quizState === 'generating'}>
                  {quizState === 'generating' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Create Quiz'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="sticky top-24">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline"><Sparkles className="h-6 w-6 text-accent" /> Your Quiz</CardTitle>
            </CardHeader>
            <CardContent className="min-h-[350px] flex flex-col">
              {quizState === 'generating' && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin mb-4" /><p>Designing questions to test your knowledge...</p></div>
              )}
              {quizState === 'idle' && (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground"><p>Your practice quiz will appear here.</p></div>
              )}
              {quizState === 'in-progress' && quizData && (
                <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                  <Progress value={((currentQuestionIndex + 1) / quizData.questions.length) * 100} className="w-full" />
                  <p className="text-sm text-muted-foreground">{quizData.title} - Question {currentQuestionIndex + 1} of {quizData.questions.length}</p>
                  <p className="font-semibold text-lg">{quizData.questions[currentQuestionIndex].questionText}</p>
                  <RadioGroup onValueChange={setSelectedAnswer} value={selectedAnswer ?? ''} disabled={!!feedback}>
                    {quizData.questions[currentQuestionIndex].options.map((option, idx) => (
                      <div key={idx} className={cn("flex items-center space-x-2 p-3 rounded-md border", feedback && (quizData.questions[currentQuestionIndex].correctAnswer === option ? 'border-green-500 bg-green-500/10' : (selectedAnswer === option ? 'border-red-500 bg-red-500/10' : '')) )}>
                        <RadioGroupItem value={option} id={`q${currentQuestionIndex}-o${idx}`} />
                        <Label htmlFor={`q${currentQuestionIndex}-o${idx}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {feedback && (
                    <div className={cn("p-4 rounded-md text-sm", feedback === 'correct' ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700')}>
                      <div className="flex items-center gap-2 font-bold mb-2">
                        {feedback === 'correct' ? <CheckCircle2 className="h-5 w-5"/> : <XCircle className="h-5 w-5" />}
                         {feedback === 'correct' ? 'Correct!' : 'Incorrect.'}
                      </div>
                      <p>{quizData.questions[currentQuestionIndex].explanation}</p>
                    </div>
                  )}
                  <Button onClick={feedback ? handleNextQuestion : handleAnswerSubmit} disabled={!selectedAnswer} className="w-full">
                    {feedback ? (currentQuestionIndex < quizData.questions.length - 1 ? 'Next Question' : 'Finish Quiz') : 'Submit Answer'} <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
              {quizState === 'finished' && quizData && (
                 <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-in fade-in-50 duration-500">
                    <CardTitle className="font-headline text-2xl">Quiz Complete!</CardTitle>
                    <CardDescription>{quizData.title}</CardDescription>
                    <p className="text-4xl font-bold">{Math.round((score / quizData.questions.length) * 100)}%</p>
                    <p className="text-muted-foreground">You answered {score} out of {quizData.questions.length} questions correctly.</p>
                    <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={restartQuiz}><RefreshCw className="mr-2 h-4 w-4"/> Try Again</Button>
                        <Button onClick={createNewQuiz}>Create New Quiz</Button>
                    </div>
                     <div className="mt-6 p-4 bg-muted/50 rounded-lg w-full">
                        <h4 className="font-headline text-md mb-2">Next Step</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Need to review? Turn these notes into flashcards.
                        </p>
                        <Button asChild variant="outline" className="w-full justify-start">
                          <Link 
                            href="/flashcards"
                            onClick={() => {
                                if (lastSuccessfulInput) {
                                    sessionStorage.setItem('focusflow-notes-for-next-step', lastSuccessfulInput);
                                }
                            }}
                          >
                            <BookCopy className="mr-2" /> Create Flashcards
                          </Link>
                        </Button>
                      </div>
                     <div className="pt-4 mt-4 border-t w-full flex justify-end">
                         <Button variant="ghost" size="icon" onClick={shareQuiz}><Share2 className="h-4 w-4" /></Button>
                     </div>
                 </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
