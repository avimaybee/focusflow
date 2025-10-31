
'use client';

import { Check, X, Sparkles, Zap, Crown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Rocket } from 'lucide-react';

const freeFeatures = [
  { name: '5 summaries per month', available: true },
  { name: '5 quizzes per month', available: true },
  { name: '3 flashcard sets per month', available: true },
  { name: '2 study plans per month', available: true },
  { name: '5 memory aids per month', available: true },
  { name: '5 document uploads per month', available: true },
  { name: 'Access to all AI personas', available: true },
  { name: 'Unlimited access to all features', available: false },
  { name: 'Advanced AI Tutor chat mode', available: false },
  { name: 'Google Calendar sync', available: false },
  { name: 'Custom prompts library', available: false },
  { name: 'Priority support', available: false },
];

const premiumFeatures = [
  { name: 'Everything in Free, plus:', highlight: true },
  { name: '🚀 Unlimited summaries, quizzes, and plans', icon: Zap },
  { name: '🎯 Unlimited flashcards and memory aids', icon: Zap },
  { name: '📄 Unlimited document uploads', icon: Zap },
  { name: '🤖 Advanced AI Tutor chat mode', icon: Star },
  { name: '📅 Google Calendar sync for study plans', icon: Star },
  { name: '💡 Save and reuse custom prompts', icon: Star },
  { name: '⚡ Priority support (24h response)', icon: Crown },
];

const powerUserHighlights = [
  { title: 'No Limits', description: 'Create unlimited study materials without monthly caps' },
  { title: 'Advanced AI', description: 'Access deeper tutoring capabilities and explanations' },
  { title: 'Smart Integration', description: 'Sync your study plans with Google Calendar' },
  { title: 'Power Tools', description: 'Build your own prompt library for recurring tasks' },
];

export default function PremiumPage() {
  return (
    <>
      <main className="flex-grow bg-secondary/30">
        {/* Prominent Beta Banner */}
        <div className="bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 border-y-2 border-primary/50">
          <div className="container mx-auto px-4 py-6">
            <Alert className="max-w-3xl mx-auto bg-background/95 backdrop-blur border-2 border-primary shadow-lg">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/20 p-2">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <AlertTitle className="text-xl font-bold leading-tight mb-2 flex items-center gap-2">
                    🎉 Early Access Beta - All Premium Features FREE!
                  </AlertTitle>
                  <AlertDescription className="text-base leading-relaxed">
                    As an early supporter, you get <strong>full Premium access at no cost</strong> while we build and refine the platform. No credit card required. Enjoy unlimited everything!
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Crown className="h-4 w-4" />
            PREMIUM UPGRADE
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tighter mb-4">
            Study Without Limits
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            Remove monthly caps, unlock advanced AI features, and supercharge your productivity with Premium.
          </p>

          {/* Power User Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
            {powerUserHighlights.map((item, index) => (
              <div key={index} className="bg-background border border-primary/20 rounded-lg p-4 text-left">
                <h3 className="font-bold text-primary mb-1 leading-tight">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl pb-16">
          {/* Free Plan */}
          <Card className="border-2 border-muted/50 hover:border-muted transition-all bg-background/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="leading-none text-2xl">Free</CardTitle>
                <div className="text-xs font-semibold text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                  STARTER
                </div>
              </div>
              <CardDescription className="leading-relaxed">Perfect for trying out FocusFlow and casual study sessions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-6">
              <div>
                <p className="text-4xl font-bold leading-none">$0</p>
                <p className="text-sm text-muted-foreground mt-1">Forever free</p>
              </div>
              <ul className="space-y-2.5 text-left">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 leading-relaxed text-sm">
                    {feature.available ? (
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                    )}
                    <span className={feature.available ? 'text-foreground' : 'text-muted-foreground/60 line-through'}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-4">
              <Button variant="outline" size="lg" className="w-full h-11 font-semibold" asChild>
                <Link href="/chat">
                  Start with Free →
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card className="border-2 border-primary shadow-2xl shadow-primary/40 hover:shadow-3xl hover:shadow-primary/50 transition-all relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-primary/80 text-primary-foreground px-6 py-2 text-sm font-bold rounded-bl-xl shadow-lg flex items-center gap-1">
              <Star className="h-4 w-4 fill-current" />
              BEST VALUE
            </div>
            <CardHeader className="pb-4 pt-10">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="leading-none text-3xl text-primary flex items-center gap-2">
                  <Crown className="h-6 w-6" />
                  Premium
                </CardTitle>
              </div>
              <CardDescription className="leading-relaxed text-base">
                For serious students who want unlimited access and advanced features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-bold leading-none text-primary">$10</p>
                  <span className="text-base font-normal text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-primary/80 mt-2 font-semibold">
                  ✨ Currently FREE in beta
                </p>
              </div>
              <ul className="space-y-3 text-left">
                {premiumFeatures.map((feature, index) => (
                  <li 
                    key={index} 
                    className={`flex items-start gap-3 leading-relaxed ${
                      feature.highlight ? 'font-bold text-primary' : ''
                    }`}
                  >
                    <Check className={`h-5 w-5 shrink-0 mt-0.5 ${
                      feature.highlight ? 'text-primary' : 'text-primary'
                    }`} />
                    <span className={feature.highlight ? 'text-primary' : 'font-medium text-foreground'}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
              
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mt-4">
                <p className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Premium Power-Ups
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No monthly limits means you can generate hundreds of study materials, upload entire textbooks, and use AI tutoring 24/7 without restrictions.
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-4">
              <Button 
                size="lg" 
                className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Crown className="mr-2 h-5 w-5" />
                Get Premium Access - Unlock Everything
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Bottom Beta Reminder */}
        <div className="container mx-auto px-4 pb-16">
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-xl p-6 text-center">
            <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Beta Access = Full Premium FREE
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Help us build the best AI study platform by using Premium features for free. Your feedback shapes the future of FocusFlow.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
