
'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Rocket } from 'lucide-react';

const freeFeatures = [
  '5 summaries per month',
  '5 quizzes per month',
  '3 flashcard sets per month',
  '2 study plans per month',
  '5 memory aids per month',
  '5 document uploads per month',
  'Access to all AI personas',
];

const premiumFeatures = [
  'Everything in Free, plus:',
  'Unlimited summaries, quizzes, and plans',
  'Unlimited flashcards and memory aids',
  'Unlimited document uploads',
  'Advanced AI Tutor chat mode',
  'Google Calendar sync for study plans',
  'Save and reuse custom prompts',
  'Priority support',
];

export default function PremiumPage() {
  return (
    <>
      <Header />
      <main className="flex-grow bg-secondary/30">
        <div className="container mx-auto px-4 py-12 text-center">
            <Alert className="max-w-2xl mx-auto mb-8 bg-background border-primary/50">
                <Rocket className="h-4 w-4" />
                <AlertTitle className="font-bold">Early Access Beta!</AlertTitle>
                <AlertDescription>
                    To thank our early users, all Premium features are currently available for free. Enjoy full access while we continue to build and improve the platform.
                </AlertDescription>
            </Alert>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
            Unlock Your Full Potential
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Upgrade to FocusFlow AI Premium to access powerful features designed to help you study smarter, not harder.
          </p>
        </div>

        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mb-12">
          {/* Free Plan */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>For casual learners and getting started.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-3xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              <ul className="space-y-2 text-left">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
                <Button variant="secondary" className="w-full" asChild>
                    <Link href="/chat">
                        Continue with Free
                    </Link>
                </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card className="border-2 border-primary shadow-lg shadow-primary/20">
            <CardHeader>
              <CardTitle>Premium</CardTitle>
              <CardDescription>For dedicated students who want to maximize their productivity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-3xl font-bold">$10<span className="text-sm font-normal text-muted-foreground">/month</span></p>
               <ul className="space-y-2 text-left">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
                <Button className="w-full premium-gradient hover:opacity-90">
                    Upgrade to Premium
                </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
