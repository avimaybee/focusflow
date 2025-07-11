'use server';

// This file acts as a centralized gateway for all AI-related server actions,
// ensuring a clean boundary between server and client code.

import { chat } from './flows/chat-flow';
import { rewriteText } from './flows/rewrite-text';
import { addCitations } from './flows/add-citations';
import { generateBulletPoints } from './flows/generate-bullet-points';
import { generateCounterarguments } from './flows/generate-counterarguments';
import { generatePresentationOutline } from './flows/generate-presentation-outline';
import { highlightKeyInsights } from './flows/highlight-key-insights';

export {
  chat,
  rewriteText,
  addCitations,
  generateBulletPoints,
  generateCounterarguments,
  generatePresentationOutline,
  highlightKeyInsights,
};
