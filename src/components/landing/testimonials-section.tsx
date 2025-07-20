'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
  {
    quote: "I turned my confusing 50-page research paper into flashcards and actually understood it. Took less than a minute.",
    name: 'Sarah J.',
    role: 'History Major, UCLA',
    avatar: '/avatars/sarah.png',
  },
  {
    quote: "FocusFlow helped me go from zero prep to a full AI-generated quiz for my psych exam. I got an A.",
    name: 'Mike T.',
    role: 'Psychology Student, NYU',
    avatar: '/avatars/mike.png',
  },
  {
    quote: "I uploaded my syllabus and had a complete semester study plan within 5 minutes. It’s a lifesaver for staying organized.",
    name: 'Emily R.',
    role: 'Pre-Med, Johns Hopkins',
    avatar: '/avatars/emily.png',
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-heading">
            Loved by Students Everywhere
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-snug">
            Don't just take our word for it. Here's what students are saying.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-background/60">
              <CardContent className="p-6">
                <p className="italic">"{testimonial.quote}"</p>
                <div className="flex items-center mt-6">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
