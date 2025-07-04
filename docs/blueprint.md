# **App Name**: FocusFlow AI

## Core Features:

- SEO-Optimized Landing Page: Attract organic users through low-difficulty, high-intent student search terms. Route: `/`. H1: 
																																																																																																																																																																																																			Free AI Note Summarizer & Study Planner for Students”. Meta tags target long-tail keywords. Speed-optimized, mobile-first. Clear CTA: “Start Free – No Signup Needed”. Includes key benefits, animated preview, FAQ with structured data, and testimonials.
- AI Note Summarizer: Upload notes (PDF or paste text). Gemini API processes it into a ~100-word digest. Output displayed in a scrollable card with “Copy Summary”, “Download”, and “Share Publicly” options. Firebase Storage for PDF, Firebase Functions for processing & Gemini API. Firestore saves summary, original text, keywords, and shareURL. Public summaries become indexable pages with academic keywords.
- AI-Powered Study Planner: Users input subjects, exam dates, and weekly study time. Gemini generates a weekly schedule. Output: Weekly planner as a table or calendar with an option to “Copy to Google Calendar” (premium). Optional: “Make this plan public” to become indexed. Study plans with titles like “12th Grade NEET Study Plan – June 2025”.
- Progress Tracker: Log study hours by subject. A bar graph compares “Goal vs Logged” per subject. Visual affirmation feels rewarding and gamified. Can integrate streaks, badges, reminders later.
- Freemium Logic: Free Users: 5 summaries/month, 1 study plan, manual tracking. Premium Users: Unlimited everything, calendar sync, custom public page titles, analytics dashboard (future). Stripe Billing via Firebase Extension. Premium = “unlocked intelligence” feel.
- SEO Blog System: Route: `/blog`. AI & productivity topics (e.g., “How to Use AI to Study Smarter”). Keywords: low-KD, long-tail student searches. Includes slug, title, keywords, and content. SEO Engine: Brings cold traffic to hot features. Internal Linking: Push users to Summarizer/Planner.

## Style Guidelines:

- Primary Color: #89B9F2 – soft blue for trust & calm
- Accent Color: #B788E6 – muted purple for calls-to-action
- Background: #1B1F23 or deep charcoal for premium dark feel
- Fonts: Poppins for headers, PT Sans for body (both Google Fonts)
- Icons: Clean line icons (e.g. Heroicons or Tabler Icons)
- Emotionally Driven Flow: Each action (summarize, plan, track) should feel like instant clarity & control
- No dead-ends: Always offer next steps ("Summarize another note", "Start a plan")
- Seamless micro-interactions: Use subtle animations for AI-generated output reveals
- Goal-driven navigation: UI leads users through Upload → Plan → Track flow