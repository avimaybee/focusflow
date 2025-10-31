"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getExamResults, type ExamResultData } from '@/lib/exam-results-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Target, 
  TrendingUp,
  RotateCcw,
  Home,
  FileText,
  Award,
  Loader2,
  Trophy,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function ExamReviewPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [result, setResult] = useState<ExamResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchExamResults() {
      if (!params.id || params.id === 'undefined') {
        setIsLoading(false);
        return;
      }
      
      try {
        const data = await getExamResults(params.id);
        setResult(data);
      } catch (error) {
        console.error('Error loading exam results:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchExamResults();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your results...</p>
      </div>
    );
  }

  if (!result || params.id === 'undefined') {
    return (
      <div className="container mx-auto py-12 max-w-4xl">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Exam Not Found</CardTitle>
            </div>
            <CardDescription>
              We couldn't find the exam results you're looking for. This might be because:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>The exam hasn't been completed yet</li>
              <li>The exam ID is invalid or expired</li>
              <li>You don't have permission to view these results</li>
            </ul>
            <div className="flex gap-3 pt-4">
              <Button asChild variant="default">
                <Link href="/practice-exam/new">
                  <FileText className="h-4 w-4 mr-2" />
                  Create New Exam
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/my-content">
                  <Home className="h-4 w-4 mr-2" />
                  Go to My Content
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-blue-600 dark:text-blue-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPerformanceMessage = (score: number) => {
    if (score >= 90) return { icon: Trophy, text: 'Outstanding!', color: 'bg-green-500' };
    if (score >= 70) return { icon: Award, text: 'Great Job!', color: 'bg-blue-500' };
    if (score >= 50) return { icon: Target, text: 'Good Effort!', color: 'bg-yellow-500' };
    return { icon: TrendingUp, text: 'Keep Practicing!', color: 'bg-orange-500' };
  };

  const performance = getPerformanceMessage(result.score);
  const PerformanceIcon = performance.icon;

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header with Performance Badge */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-full ${performance.color}`}>
            <PerformanceIcon className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-2">{performance.text}</h1>
        <p className="text-muted-foreground text-lg">{result.examTitle}</p>
        <Badge variant="outline" className="mt-2">{result.difficulty} Difficulty</Badge>
      </div>

      {/* Score Overview Card */}
      <Card className="mb-6 border-2">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-6xl font-bold mb-2">
            <span className={getPerformanceColor(result.score)}>{result.score}%</span>
          </CardTitle>
          <CardDescription className="text-base">
            {result.correctAnswers} correct out of {result.totalQuestions} questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={result.score} className="h-3 mb-6" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{result.correctAnswers}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <XCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold text-red-600">{result.wrongAnswers}</p>
              <p className="text-xs text-muted-foreground">Wrong</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertCircle className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
              <p className="text-2xl font-bold text-yellow-600">{result.skippedQuestions}</p>
              <p className="text-xs text-muted-foreground">Skipped</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-600">{result.timeSpent}</p>
              <p className="text-xs text-muted-foreground">Time Spent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-8 justify-center">
        <Button asChild size="lg" variant="default">
          <Link href="/practice-exam/new">
            <RotateCcw className="h-4 w-4 mr-2" />
            Take Another Exam
          </Link>
        </Button>
        
        <Button asChild size="lg" variant="outline">
          <Link href={`/practice-exam/${params.id}`}>
            <FileText className="h-4 w-4 mr-2" />
            Review Questions
          </Link>
        </Button>
        
        <Button asChild size="lg" variant="outline">
          <Link href="/my-content">
            <Home className="h-4 w-4 mr-2" />
            My Content
          </Link>
        </Button>
      </div>

      <Separator className="my-8" />

      {/* Detailed Breakdown */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Question Breakdown</h2>
        
        {result.questionBreakdown.map((item, index) => (
          <Card key={index} className={`border-l-4 ${item.isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={item.isCorrect ? 'default' : 'destructive'}>
                      Question {index + 1}
                    </Badge>
                    {item.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <CardTitle className="text-lg">{item.question}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Your Answer:</p>
                  <p className={`font-medium ${item.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {item.userAnswer || 'No answer provided'}
                  </p>
                </div>
                {!item.isCorrect && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Correct Answer:</p>
                    <p className="font-medium text-green-600">{item.correctAnswer}</p>
                  </div>
                )}
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Explanation:
                </p>
                <p className="text-sm leading-relaxed">{item.explanation}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 text-center bg-primary/5 border border-primary/20 rounded-xl p-8">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h3 className="text-2xl font-bold mb-2">Keep Learning!</h3>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Practice makes perfect. Create more exams to master your subject and track your improvement over time.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button asChild size="lg">
            <Link href="/practice-exam/new">
              Create New Exam
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard/analytics">
              View Analytics
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
