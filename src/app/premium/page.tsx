import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Sparkles } from "lucide-react";

export const metadata = {
  title: "Go Premium | FocusFlow AI",
  description: "Unlock unlimited access to all of FocusFlow AI's features and supercharge your studies.",
};

const premiumFeatures = [
    { title: "Unlimited Summaries", description: "Generate as many summaries as you need without any monthly limits." },
    { title: "Unlimited Flashcards & Quizzes", description: "Create endless flashcard sets and practice quizzes from your notes." },
    { title: "Google Calendar Sync", description: "Automatically sync your generated study plans with your Google Calendar." },
    { title: "Public Sharing & Custom URLs", description: "Share your summaries, flashcards, and plans with custom, memorable links." },
    { title: "Advanced Analytics", description: "Get deeper insights into your study habits and progress over time. (Coming Soon)" },
    { title: "Priority Support", description: "Get faster responses and dedicated help from our support team. (Coming Soon)" },
];


export default function PremiumPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="text-center mb-12">
        <Sparkles className="mx-auto h-12 w-12 text-accent" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold mt-4">Unlock Your Full Potential</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Go premium to get unlimited access to all of FocusFlow AI's powerful study tools.
        </p>
      </div>
      
      <Card className="p-8 shadow-xl">
        <CardHeader className="text-center p-0 mb-8">
            <CardTitle className="font-headline text-3xl">FocusFlow AI Premium</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10">
                {premiumFeatures.map(feature => (
                    <div key={feature.title} className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">{feature.title}</p>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="text-center">
                <Button size="lg" className="font-headline w-full md:w-auto">
                    Upgrade Now - $5/month
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Billed annually, or $8 month-to-month. Cancel anytime.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
