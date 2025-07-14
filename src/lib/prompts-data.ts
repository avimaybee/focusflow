
'use server';

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: 'Explain' | 'Summarize' | 'Brainstorm' | 'Edit' | 'Create';
  icon: 'Bot' | 'FileText' | 'Brain' | 'Pencil' | 'PenLine';
}

// In a real app, this data would live in a Firestore 'promptTemplates' collection.
const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'summarize-key-points',
    title: 'Summarize Key Points',
    description: 'Condenses a long text into the most important bullet points.',
    prompt: 'Summarize the following text into 3-5 key bullet points, focusing on the main arguments and conclusions:\n\n[PASTE TEXT HERE]',
    category: 'Summarize',
    icon: 'FileText',
  },
  {
    id: 'brainstorm-essay-ideas',
    title: 'Brainstorm Essay Ideas',
    description: 'Generates a list of unique angles and thesis statements for an essay.',
    prompt: 'Brainstorm 3-5 unique essay ideas or thesis statements for the following topic: [YOUR TOPIC HERE]. For each idea, provide a brief explanation of the potential argument.',
    category: 'Brainstorm',
    icon: 'Brain',
  },
  {
    id: 'proofread-and-clarify',
    title: 'Proofread & Clarify',
    description: 'Checks for errors and suggests improvements for clarity and flow.',
    prompt: 'Please proofread the following text. Correct any spelling or grammar errors, and suggest ways to improve its clarity and flow without changing the core meaning:\n\n[PASTE TEXT HERE]',
    category: 'Edit',
    icon: 'Pencil',
  },
  {
    id: 'create-study-plan',
    title: 'Create a Study Plan',
    description: 'Generates a structured weekly study schedule for a specific goal.',
    prompt: 'Create a 1-week study plan for my upcoming exam on [SUBJECT], which is on [DATE]. I have approximately [HOURS] hours to study each day. Break down the topics and include time for review.',
    category: 'Create',
    icon: 'PenLine',
  },
  {
    id: 'generate-flashcards',
    title: 'Generate Flashcards',
    description: 'Creates question/answer pairs for key terms and concepts.',
    prompt: 'Generate a set of 10 flashcards (in question/answer format) from the following text, focusing on key definitions and concepts:\n\n[PASTE TEXT HERE]',
    category: 'Create',
    icon: 'FileText',
  },
  {
    id: 'generate-practice-quiz',
    title: 'Generate a Practice Quiz',
    description: 'Creates multiple-choice questions to test your knowledge.',
    prompt: 'Create a 5-question multiple-choice quiz based on the text below. For each question, provide 4 plausible options and indicate the correct answer with an explanation.\n\n[PASTE TEXT HERE]',
    category: 'Create',
    icon: 'PenLine',
  },
  {
    id: 'find-counterarguments',
    title: 'Find Counterarguments',
    description: 'Generates counterarguments to strengthen your thesis.',
    prompt: 'Analyze the following argument and generate 3-5 well-reasoned counterarguments. For each counterargument, provide a brief explanation.\n\nArgument: "[YOUR ARGUMENT HERE]"',
    category: 'Brainstorm',
    icon: 'Brain',
  },
  {
    id: 'improve-writing-style',
    title: 'Improve Writing Style',
    description: 'Rewrites a paragraph to be more academic, concise, or persuasive.',
    prompt: 'Please rewrite the following paragraph to make it more [academic/concise/persuasive]. Focus on improving sentence structure and word choice:\n\n[PASTE PARAGRAPH HERE]',
    category: 'Edit',
    icon: 'Pencil',
  },
];


export async function getPromptTemplates(): Promise<PromptTemplate[]> {
  // In a real implementation, you would fetch this from Firestore.
  // For now, we return the static list.
  return PROMPT_TEMPLATES;
}
