'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GlowingBorder } from '../ui/glowing-border';

export function TestimonialsSection({ testimonials }) {
  return (
    <section id="testimonials" className="py-20">
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
            <div key={index} className="relative rounded-lg">
              <GlowingBorder
                borderWidth={2}
                glow={true}
                className="rounded-lg"
                disabled={false}
                movementDuration={1}
              />
              <Card className="bg-transparent h-full">
                <CardContent className="p-6">
                  <p className="italic">"{testimonial.quote}"</p>
                  <div className="flex items-center mt-6">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4">
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
