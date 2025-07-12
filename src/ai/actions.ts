'use server';

import {run} from 'genkit/ai';
import {z} from 'zod';
import {
  RewriteTextRequest,
  RewriteTextResponse,
  GenerateBulletPointsRequest,
  GenerateBulletPointsResponse,
  GenerateCounterargumentsRequest,
  GenerateCounterargumentsResponse,
  HighlightKeyInsightsRequest,
  HighlightKeyInsightsResponse,
} from './flows/chat-types';
import {rewriteTextFlow} from './flows/rewrite-text';
import {generateBulletPointsFlow} from './flows/generate-bullet-points';
import {generateCounterargumentsFlow} from './flows/generate-counterarguments';
import {highlightKeyInsightsFlow} from './flows/highlight-key-insights';
import {chat as chatFlow} from './flows/chat-flow';
import {ChatInput} from './flows/chat-types';
import pdf from 'pdf-parse/lib/pdf-parse';

export async function rewriteText(
  input: z.infer<typeof RewriteTextRequest>,
): Promise<z.infer<typeof RewriteTextResponse>> {
  return run(rewriteTextFlow, input);
}

export async function generateBulletPoints(
  input: z.infer<typeof GenerateBulletPointsRequest>,
): Promise<z.infer<typeof GenerateBulletPointsResponse>> {
  return run(generateBulletPointsFlow, input);
}

export async function generateCounterarguments(
  input: z.infer<typeof GenerateCounterargumentsRequest>,
): Promise<z.infer<typeof GenerateCounterargumentsResponse>> {
  return run(generateCounterargumentsFlow, input);
}

export async function highlightKeyInsights(
  input: z.infer<typeof HighlightKeyInsightsRequest>,
): Promise<z.infer<typeof HighlightKeyInsightsResponse>> {
  return run(highlightKeyInsightsFlow, input);
}

export async function chat(input: ChatInput) {
  return run(chatFlow, input);
}

export async function extractText(
  url: string,
  type: string,
): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  if (type.includes('pdf')) {
    const buffer = await blob.arrayBuffer();
    const data = await pdf(buffer);
    return data.text;
  } else {
    return blob.text();
  }
}