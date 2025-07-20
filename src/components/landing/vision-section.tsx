'use client';

import { GraduationCap, Users, ShieldCheck } from 'lucide-react';

export function VisionSection() {
  return (
    <div className="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
      <div className="max-w-2xl mx-auto">
        <div className="grid gap-12">
          <div>
            <h2 className="text-3xl text-foreground font-bold lg:text-4xl">
              Our Vision
            </h2>
            <p className="mt-3 text-muted-foreground">
              We believe that learning should be an empowering and personalized journey, not a one-size-fits-all struggle. Our vision is to create an AI partner that not only helps students study, but also inspires them to learn more deeply and effectively.
            </p>
          </div>

          <div className="space-y-6 lg:space-y-10">
            <div className="flex gap-x-5 sm:gap-x-8">
              <GraduationCap className="shrink-0 mt-2 size-6 text-foreground" />
              <div className="grow">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  Personalized Learning for All
                </h3>
                <p className="mt-1 text-muted-foreground">
                  Our goal is to make personalized learning accessible to every student, regardless of their background or resources. We're building tools that adapt to individual learning styles and needs.
                </p>
              </div>
            </div>

            <div className="flex gap-x-5 sm:gap-x-8">
              <Users className="shrink-0 mt-2 size-6 text-foreground" />
              <div className="grow">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  Fostering a Study Community
                </h3>
                <p className="mt-1 text-muted-foreground">
                  Beyond creating powerful tools, we aim to bring students together. Our public profiles and content sharing features are designed to foster a vibrant community of learners.
                </p>
              </div>
            </div>

            <div className="flex gap-x-5 sm:gap-x-8">
              <ShieldCheck className="shrink-0 mt-2 size-6 text-foreground" />
              <div className="grow">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  Simple, Secure, and Trustworthy
                </h3>
                <p className="mt-1 text-muted-foreground">
                  We are committed to building a platform that is not only powerful but also simple to use, secure with your data, and a trustworthy partner in your academic journey.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
