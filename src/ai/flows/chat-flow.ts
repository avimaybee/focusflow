'use server';

// This file is now used to configure the Genkit instance.
// The actual API logic is in the API route.

import { genkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';
import { supabasePersistence } from '@genkit-ai/supabase';
import { createClient } from '@supabase/supabase-js';

// This is a temporary solution. In a real app, you would want to
// initialize the Supabase client once and share it.
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const ai = genkit({
  plugins: [
    googleAI({
        apiKey: process.env.GEMINI_API_KEY
    }),
    supabasePersistence({
      client: supabase,
      table: 'chat_sessions',
    }),
  ],
  logSinks: [],
  enableTracingAndMetrics: true,
});
