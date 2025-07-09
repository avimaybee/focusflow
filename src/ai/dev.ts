import { config } from 'dotenv';
config();

import '@/ai/flows/chat-flow.ts';
import '@/ai/flows/summarize-notes.ts';
import '@/ai/flows/create-study-plan.ts';
import '@/ai/flows/create-flashcards.ts';
import '@/ai/flows/create-quiz.ts';
import '@/ai/flows/explain-concept.ts';
import '@/ai/flows/create-memory-aid.ts';
import '@/ai/flows/create-discussion-prompts.ts';
import '@/ai/flows/rewrite-text.ts';
import '@/ai/flows/add-citations.ts';
import '@/ai/flows/generate-bullet-points.ts';
import '@/ai/flows/generate-counterarguments.ts';
