
'use server';

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


export async function rewriteText(
  input: z.infer<typeof RewriteTextRequest>,
): Promise<z.infer<typeof RewriteTextResponse>> {
  return await rewriteTextFlow(input);
}

export async function generateBulletPoints(
  input: z.infer<typeof GenerateBulletPointsRequest>,
): Promise<z.infer<typeof GenerateBulletPointsResponse>> {
  return await generateBulletPointsFlow(input);
}

export async function generateCounterarguments(
  input: z.infer<typeof GenerateCounterargumentsRequest>,
): Promise<z.infer<typeof GenerateCounterargumentsResponse>> {
  return await generateCounterargumentsFlow(input);
}

export async function highlightKeyInsights(
  input: z.infer<typeof HighlightKeyInsightsRequest>,
): Promise<z.infer<typeof HighlightKeyInsightsResponse>> {
  return await highlightKeyInsightsFlow(input);
}

export async function chat(input: ChatInput) {
  return await chatFlow(input);
}
