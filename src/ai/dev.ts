import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-notes.ts';
import '@/ai/flows/create-study-plan.ts';
import '@/ai/flows/create-flashcards.ts';
import '@/ai/flows/create-quiz.ts';
import '@/ai/flows/explain-concept.ts';
import '@/ai/flows/create-memory-aid.ts';
import '@/ai/flows/tutor-chat.ts';
import '@/ai/flows/create-discussion-prompts.ts';
