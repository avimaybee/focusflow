
'use client';

import { GraduationCap, Users, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

const visionPoints = [
    {
        icon: <GraduationCap className="h-8 w-8 text-primary" />,
        title: "Personalized Learning",
        description: "To make personalized learning accessible to every student, regardless of their background or resources. We're building tools that adapt to individual learning styles and needs."
    },
    {
        icon: <Users className="h-8 w-8 text-primary" />,
        title: "Fostering Community",
        description: "To bring students together, not just create tools. Our public profiles and content sharing features are designed to foster a vibrant, collaborative community of learners."
    },
    {
        icon: <ShieldCheck className="h-8 w-8 text-primary" />,
        title: "Simple & Trustworthy",
        description: "To build a platform that is not only powerful but also simple to use, secure with your data, and a trustworthy partner in your academic journey."
    }
]

export function VisionSection() {
  return (
    <section id="vision" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold font-heading">
                    Our Vision
                </h2>
                <p className="mt-4 text-lg text-muted-foreground leading-snug">
                    We believe learning should be an empowering and personalized journey, not a one-size-fits-all struggle.
                </p>
            </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                {visionPoints.map((point, index) => (
                    <Card key={index} className="bg-background/50 text-center flex flex-col items-center p-4">
                        <CardHeader>
                            <div className="p-4 bg-primary/10 rounded-full inline-flex mb-4 items-center justify-center">
                                {point.icon}
                            </div>
                            <CardTitle>{point.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{point.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    </section>
  );
}
