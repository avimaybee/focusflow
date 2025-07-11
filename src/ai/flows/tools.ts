/**
 * @fileOverview Defines Genkit tools that wrap the individual AI flows.
 * These tools are used by the main chat router flow to delegate tasks.
 */
import {ai} from '@/ai/genkit';
import {summarizeNotes} from './summarize-notes';
import {createStudyPlan, CreateStudyPlanInputSchema} from './create-study-plan';
import {createFlashcards} from './create-flashcards';
import {createQuiz} from './create-quiz';
import {explainConcept, ExplainConceptInputSchema} from './explain-concept';
import {createMemoryAid, CreateMemoryAidInputSchema} from './create-memory-aid';
import {createDiscussionPrompts} from './create-discussion-prompts';
import {generatePresentationOutline} from './generate-presentation-outline';
import {highlightKeyInsights} from './highlight-key-insights';
import {z} from 'genkit';
import {PersonaSchema} from './chat-types';

const ContextualToolInputSchema = z.object({
  context: z
    .string()
    .describe(
      'The source material for the tool, either as plain text or a data URI for a file (e.g., PDF).'
    ),
  persona: PersonaSchema.optional().describe('The AI persona to adopt.'),
});

export const summarizeNotesTool = ai.defineTool(
  {
    name: 'summarizeNotes',
    description:
      'Summarizes a long piece of text or a document into a concise digest. Use this when the user asks to summarize their notes, a document, or pasted text.',
    inputSchema: ContextualToolInputSchema,
    outputSchema: z.string().describe('The generated summary text.'),
  },
  async input => {
    const isFile = input.context.startsWith('data:');
    const result = await summarizeNotes({
      pdfNotes: isFile ? input.context : undefined,
      textNotes: !isFile ? input.context : undefined,
      persona: input.persona,
    });
    return `Summary:\n${result.summary}\n\nKeywords: ${result.keywords}`;
  }
);

export const createStudyPlanTool = ai.defineTool(
  {
    name: 'createStudyPlan',
    description:
      'Generates a structured, weekly study plan based on subjects, exam dates, and available time. Use this when the user asks for a study plan or schedule.',
    inputSchema: CreateStudyPlanInputSchema,
    outputSchema: z
      .string()
      .describe('An HTML table string containing the full study plan.'),
  },
  async input => {
    const result = await createStudyPlan(input);
    let planString = `<h3>${result.title}</h3>`;
    planString += '<table>';
    planString += '<thead><tr><th>Day</th><th>Tasks</th></tr></thead>';
    planString += '<tbody>';
    result.plan.forEach(day => {
      planString += `<tr><td><strong>${day.day}</strong></td><td>${day.tasks}</td></tr>`;
    });
    planString += '</tbody></table>';
    return planString;
  }
);

export const createFlashcardsTool = ai.defineTool(
  {
    name: 'createFlashcards',
    description:
      'Generates a set of question-and-answer flashcards from a piece of text or a document. Use this when a user asks for flashcards.',
    inputSchema: ContextualToolInputSchema,
    outputSchema: z.string().describe('A JSON string containing the flashcards.'),
  },
  async input => {
    const isFile = input.context.startsWith('data:');
    const result = await createFlashcards({
      sourcePdf: isFile ? input.context : undefined,
      sourceText: !isFile ? input.context : undefined,
      persona: input.persona,
    });
    return JSON.stringify({ flashcards: result.flashcards });
  }
);

export const createQuizTool = ai.defineTool(
  {
    name: 'createQuiz',
    description:
      'Generates a multiple-choice quiz from a piece of text or a document. Use this when a user asks for a quiz or wants to test their knowledge.',
    inputSchema: ContextualToolInputSchema,
    outputSchema: z.string().describe('A JSON string containing the quiz.'),
  },
  async input => {
    const isFile = input.context.startsWith('data:');
    const result = await createQuiz({
      sourcePdf: isFile ? input.context : undefined,
      sourceText: !isFile ? input.context : undefined,
      persona: input.persona,
    });
    return JSON.stringify({ quiz: result });
  }
);

export const explainConceptTool = ai.defineTool(
  {
    name: 'explainConcept',
    description:
      'Explains a specific highlighted term or concept within a larger body of text. Use this when a user asks "what is..." or "explain...". The user must provide both the term to explain and the full text for context.',
    inputSchema: ExplainConceptInputSchema,
    outputSchema: z
      .string()
      .describe('A formatted string containing the explanation and an example.'),
  },
  async input => {
    const result = await explainConcept(input);
    return `**Explanation of "${input.highlightedText}"**\n\n${result.explanation}\n\n**Example:**\n${result.example}`;
  }
);

export const createMemoryAidTool = ai.defineTool(
  {
    name: 'createMemoryAid',
    description:
      'Generates a mnemonic, rhyme, story, or other memory aid for a specific concept. Use this when a user asks for help remembering something.',
    inputSchema: CreateMemoryAidInputSchema,
    outputSchema: z
      .string()
      .describe('A formatted string containing the generated memory aids.'),
  },

  async input => {
    const result = await createMemoryAid(input);
    let aidString = `Here are some memory aids for **${input.concept}**:\n\n`;
    if (result.acronym) aidString += `**Acronym:** ${result.acronym}\n`;
    if (result.rhyme) aidString += `**Rhyme:** ${result.rhyme}\n`;
    if (result.story) aidString += `**Story:** ${result.story}\n`;
    if (result.imagery) aidString += `**Imagery:** ${result.imagery}\n`;
    return aidString;
  }
);

export const createDiscussionPromptsTool = ai.defineTool(
  {
    name: 'createDiscussionPrompts',
    description:
      'Generates a set of discussion prompts or questions for a study group based on a piece of text or a document. Use this when a user asks for discussion topics or questions.',
    inputSchema: ContextualToolInputSchema,
    outputSchema: z
      .string()
      .describe('A formatted string containing the generated discussion prompts.'),
  },
  async input => {
    const isFile = input.context.startsWith('data:');
    const result = await createDiscussionPrompts({
      sourcePdf: isFile ? input.context : undefined,
      sourceText: !isFile ? input.context : undefined,
      persona: input.persona,
    });
    let promptString = 'Here are some discussion prompts:\n\n';
    result.prompts.forEach(p => {
      promptString += `**[${p.type}]** ${p.text}\n\n`;
    });
    return promptString;
  }
);

export const generatePresentationOutlineTool = ai.defineTool(
  {
    name: 'generatePresentationOutline',
    description: 'Generates a structured presentation outline from a piece of text or a document.',
    inputSchema: ContextualToolInputSchema,
    outputSchema: z.string().describe('A formatted string containing the presentation outline.'),
  },
  async input => {
    const isFile = input.context.startsWith('data:');
    const result = await generatePresentationOutline({
      sourcePdf: isFile ? input.context : undefined,
      sourceText: !isFile ? input.context : undefined,
      persona: input.persona,
    });
    let outlineString = `## ${result.title}\n\n`;
    result.slides.forEach((slide, index) => {
      outlineString += `### **Slide ${index + 1}: ${slide.title}**\n`;
      slide.bulletPoints.forEach(point => {
        outlineString += `- ${point}\n`;
      });
      outlineString += '\n';
    });
    return outlineString;
  }
);

export const highlightKeyInsightsTool = ai.defineTool(
  {
    name: 'highlightKeyInsights',
    description: 'Identifies and highlights the key insights or takeaways from a piece of text or a document.',
    inputSchema: ContextualToolInputSchema,
    outputSchema: z.string().describe('A formatted string containing the key insights.'),
  },
  async input => {
    const isFile = input.context.startsWith('data:');
    const result = await highlightKeyInsights({
      sourcePdf: isFile ? input.context : undefined,
      sourceText: !isFile ? input.context : undefined,
      persona: input.persona,
    });
    let insightsString = '### Key Insights\n\n';
    result.insights.forEach(insight => {
      insightsString += `- ${insight}\n`;
    });
    return insightsString;
  }
);
