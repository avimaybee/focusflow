
'use client';

import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import {
  ChatInput,
  RewriteTextInput,
  GenerateBulletPointsInput,
  GenerateCounterargumentsInput,
  HighlightKeyInsightsInput
} from '@/types/chat-types';
import { useToast } from '@/hooks/use-toast';

// Get a reference to the deployed chat function
const chatFunction = httpsCallable(functions, 'chat');

export async function chat(input: ChatInput) {
  try {
    const result = await chatFunction(input);
    return result.data as any; // Cast to 'any' to avoid type conflicts with server-side types
  } catch (error) {
    console.error("Firebase Functions call failed:", error);
    const { toast } = useToast();
    toast({
      variant: 'destructive',
      title: 'Connection Error',
      description: 'Could not connect to the AI service. Please check your connection and try again.'
    });
    // Return an error object that the UI can handle
    return { 
      response: '<p>Sorry, there was a connection error. Please try again.</p>',
      rawResponse: 'Sorry, there was a connection error. Please try again.',
      isError: true 
    };
  }
}

// These actions are placeholders for future "Smart Tool" implementations.
// They would call separate Firebase Functions if implemented.

export async function rewriteText(input: RewriteTextInput) {
  // Placeholder: In a real app, this would call a specific 'rewriteText' cloud function.
  console.log('Rewriting text:', input);
  return { rewrittenText: `This is a rewritten version of: "${input.textToRewrite}"` };
}

export async function generateBulletPoints(input: GenerateBulletPointsInput) {
  console.log('Generating bullet points for:', input);
  return { bulletPoints: [`- Point 1 for ${input.textToConvert}`, `- Point 2 for ${input.textToConvert}`] };
}

export async function generateCounterarguments(input: GenerateCounterargumentsInput) {
  console.log('Generating counterarguments for:', input);
  return { counterarguments: [`- A counterargument for ${input.statementToChallenge} is...`] };
}

export async function highlightKeyInsights(input: HighlightKeyInsightsInput) {
  console.log('Highlighting insights for:', input);
  return { insights: [`- A key insight from the text is...`] };
}
