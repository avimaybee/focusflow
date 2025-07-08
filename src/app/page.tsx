
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  ArrowRight,
  BookCopy,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Sparkles,
} from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Free AI Study Tools: Summarizer, Flashcards, Quizzes & Planner | FocusFlow AI',
  description:
    'Supercharge your studies with free AI tools. Get instant note summaries, generate flashcards and quizzes, and create smart study plans. No signup required to start.',
};

const features = [
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: 'Instant Clarity, Not Just Summaries',
    description:
      'Turn long lecture notes or dense articles into concise, actionable summaries. Grasp key insights in seconds and spend less time reading.',
  },
  {
    icon: <BookCopy className="h-8 w-8 text-primary" />,
    title: 'Master with Active Recall',
    description:
      "Don't just re-read. Automatically generate flashcards from your notes to test your memory, a scientifically proven way to learn faster.",
  },
  {
    icon: <ClipboardCheck className="h-8 w-8 text-primary" />,
    title: 'Test Your Understanding',
    description:
      'Generate relevant multiple-choice quizzes from any material. Get instant feedback with explanations to find and fill your knowledge gaps.',
  },
  {
    icon: <CalendarDays className="h-8 w-8 text-primary" />,
    title: 'Your Perfect Study Schedule',
    description:
      'Get a personalized, manageable study schedule based on your subjects and exam dates, all intelligently created by AI to keep you on track.',
  },
];

const faqItems = [
  {
    question: 'Is FocusFlow AI really free?',
    answer:
      'Yes! Our core features—including the AI Summarizer, Flashcard Generator, Quiz Creator, and Study Planner—are available for free with generous usage limits. We believe every student deserves access to tools that can help them succeed.',
  },
  {
    question: 'What kind of notes can I use?',
    answer:
      'You can either paste text directly into our tools or upload PDF files. Our AI is designed to handle various formats, from class lecture notes to dense academic articles, transforming them into summaries, flashcards, or quizzes.',
  },
  {
    question: 'How does the AI generate flashcards and quizzes?',
    answer:
      'Simply provide your study material, and our AI analyzes the key concepts to generate effective study aids. It creates clear question-and-answer pairs for flashcards and relevant multiple-choice questions with explanations for quizzes, helping you actively test your knowledge.',
  },
  {
    question: 'How does the AI Study Planner work?',
    answer:
      "It's simple. You provide the AI with your list of subjects, your exam dates, and how many hours you can study per week. The AI then intelligently allocates study time for each subject, creating a balanced and effective weekly schedule to keep you on track.",
  },
  {
    question: 'Do I need to create an account to get started?',
    answer:
      "No signup is needed to try our tools! You can start summarizing, creating flashcards, and planning your studies right away. Creating an account allows you to save your history and access more features, but it's not required to experience the power of FocusFlow AI.",
  },
];

const testimonials = [
  {
    name: 'Sarah L.',
    title: 'University Student',
    quote:
      "FocusFlow AI is a game-changer. The summarizer saved me hours of reading, and the flashcard generator is perfect for quick reviews before class. I've never felt more in control of my studies.",
    avatar: 'https://placehold.co/100x100.png',
  },
  {
    name: 'David C.',
    title: 'High School Senior',
    quote:
      "The AI quiz creator is amazing for checking my understanding. It's like having unlimited practice tests. Plus, the study planner laid everything out for my final exams. So helpful!",
    avatar: 'https://placehold.co/100x100.png',
  },
  {
    name: 'Mei Ling',
    title: 'Postgraduate Researcher',
    quote:
      'The ability to quickly summarize research papers and then turn them into flashcards is invaluable. FocusFlow AI dramatically speeds up my literature review process. Highly recommend!',
    avatar: 'https://placehold.co/100x100.png',
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 md:py-32 text-center">
        <div className="container mx-auto px-4">
          <Sparkles className="mx-auto h-12 w-12 text-accent" />
          <h1 className="font-headline text-4xl md:text-6xl font-bold mt-4 max-w-4xl mx-auto">
            Your All-in-One AI Study Toolkit
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop juggling apps. Go from lecture notes to a full study plan in one seamless workflow. Summarize, create flashcards, generate quizzes, and plan your success.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="font-headline">
              <Link href="/summarizer">
                Start Free – No Signup Needed <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Animated Preview Section */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="w-full max-w-4xl mx-auto rounded-lg shadow-2xl overflow-hidden ring-1 ring-border">
            <div className="p-2 bg-muted">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500"></span>
                <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
                <span className="h-3 w-3 rounded-full bg-green-500"></span>
              </div>
            </div>
            <Image
              src="https://placehold.co/1200x675.gif"
              alt="Animated preview of FocusFlow AI"
              width={1200}
              height={675}
              className="w-full"
              data-ai-hint="app animation"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">
              A Smarter Way to Learn, Not Just Study
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              FocusFlow AI helps you actively engage with your material for deeper understanding and long-term retention.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center bg-card/50">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="font-headline text-xl mt-4">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 md:py-28 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">
              Loved by Students Worldwide
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Don't just take our word for it. Here's what students are saying.
            </p>
          </div>
          <Carousel
            opts={{ align: 'start', loop: true }}
            className="w-full max-w-4xl mx-auto mt-16"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem
                  key={index}
                  className="md:basis-1/2 lg:basis-1/3"
                >
                  <div className="p-1 h-full">
                    <Card className="h-full flex flex-col justify-between">
                      <CardContent className="pt-6">
                        <p className="italic">"{testimonial.quote}"</p>
                      </CardContent>
                      <CardHeader className="flex-row items-center gap-4">
                        <Avatar>
                          <AvatarImage
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            data-ai-hint="person"
                          />
                          <AvatarFallback>
                            {testimonial.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {testimonial.title}
                          </p>
                        </div>
                      </CardHeader>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Have questions? We have answers.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full mt-12">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-headline text-lg">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 text-center border-t">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl md:text-4xl font-bold">
            Ready to Unlock Your Potential?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Give your studies the AI-powered boost they deserve. Get started in
            seconds—no credit card, no sign-up, just pure productivity.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="font-headline">
              <Link href="/summarizer">
                Start Studying Smarter Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

    