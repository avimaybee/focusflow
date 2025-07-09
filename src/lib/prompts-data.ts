
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
    id: 'explain-concept',
    title: 'Explain a Concept',
    description: 'Breaks down a complex topic into a simple explanation with an example.',
    prompt: 'Explain the concept of [YOUR CONCEPT HERE] using the context below. Provide a simple explanation and a clear example.\n\nContext:\n',
    category: 'Explain',
    icon: 'Bot',
  },
  {
    id: 'summarize-text',
    title: 'Summarize Text',
    description: 'Condenses a long piece of text into key bullet points.',
    prompt: 'Summarize the following text into 3-5 key bullet points:\n\n',
    category: 'Summarize',
    icon: 'FileText',
  },
  {
    id: 'brainstorm-ideas',
    title: 'Brainstorm Ideas',
    description: 'Generates a list of creative ideas or different angles on a topic.',
    prompt: 'Brainstorm a list of creative ideas related to [YOUR TOPIC HERE]. Think about different perspectives and approaches.',
    category: 'Brainstorm',
    icon: 'Brain',
  },
  {
    id: 'proofread-text',
    title: 'Proofread Text',
    description: 'Checks for and corrects spelling and grammar errors in a block of text.',
    prompt: 'Please proofread the following text for any spelling or grammatical errors and provide the corrected version:\n\n',
    category: 'Edit',
    icon: 'Pencil',
  },
  {
    id: 'create-study-plan',
    title: 'Create Study Plan',
    description: 'Generates a structured study plan for a subject or exam.',
    prompt: 'Create a 1-week study plan for an exam on [SUBJECT] happening on [DATE]. I can study for [HOURS] per week.',
    category: 'Create',
    icon: 'PenLine',
  },
    {
    id: 'create-flashcards',
    title: 'Create Flashcards',
    description: 'Generates question/answer pairs for key concepts in your notes.',
    prompt: 'Create 5 flashcards (question and answer format) based on the key concepts in the following notes:\n\n',
    category: 'Create',
    icon: 'FileText',
  },
  {
    id: 'create-quiz',
    title: 'Create a Practice Quiz',
    description: 'Generates multiple-choice questions to test your knowledge.',
    prompt: 'Create a 5-question multiple-choice quiz based on the text below. Include an answer key with explanations.\n\n',
    category: 'Create',
    icon: 'PenLine',
  },
  {
    id: 'ask-socratic-questions',
    title: 'Ask Socratic Questions',
    description: 'Generates probing questions to help you think more deeply.',
    prompt: 'Act as a Socratic guide. Ask me three thought-provoking questions about the following topic to help me explore it more deeply:\n\n',
    category: 'Brainstorm',
    icon: 'Brain',
  },
  {
    id: 'rephrase-for-clarity',
    title: 'Improve Writing',
    description: 'Rewrites a sentence or paragraph to be clearer and more concise.',
    prompt: 'Please rewrite the following text to improve its clarity, conciseness, and overall flow:\n\n',
    category: 'Edit',
    icon: 'Pencil',
  },
];


export async function getPromptTemplates(): Promise<PromptTemplate[]> {
  // In a real implementation, you would fetch this from Firestore.
  // For now, we return the static list.
  return PROMPT_TEMPLATES;
}
