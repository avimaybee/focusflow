export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  content: string;
}

export const posts: Post[] = [
  {
    slug: 'how-to-study-smarter-with-ai',
    title: 'How to Study Smarter, Not Harder, with AI Tools',
    excerpt:
      'Discover five ways you can leverage AI to supercharge your study sessions, from generating summaries to creating personalized quizzes.',
    date: '2025-07-15',
    author: 'Jane Doe, EdTech Specialist',
    content: `
## The Challenge of Modern Studying

In today's fast-paced academic world, the sheer volume of information can be overwhelming. Traditional study methods, while valuable, often fall short in helping students efficiently process and retain knowledge. This is where AI study tools like FocusFlow AI can be a game-changer.

## 1. Automated Summarization

Instead of spending hours manually highlighting and condensing texts, you can use an AI summarizer to get the key points in seconds. This frees up your time to focus on understanding the core concepts rather than getting bogged down in the details.

## 2. Active Recall with Flashcards

Passive reading is one of the least effective ways to learn. AI can instantly turn your notes into a deck of flashcards, prompting you to actively recall information, which is scientifically proven to strengthen memory retention.

## 3. Personalized Quizzes

Test your knowledge with quizzes tailored to your study materials. AI can generate a variety of question types to ensure you've grasped the concepts from multiple angles. This is far more effective than generic, one-size-fits-all tests.

## 4. The AI Tutor

Ever been stuck on a concept and wished you had a tutor on standby? With a conversational AI chat, you can ask for explanations, examples, and analogies 24/7, ensuring you never lose momentum while studying.

## 5. Smart Study Planning

Feeling overwhelmed and not sure where to start? AI can help you create a structured study plan based on your materials and deadlines, breaking down large topics into manageable chunks.

By integrating these AI-powered strategies, you can create a more efficient, engaging, and effective learning workflow.
`,
  },
  {
    slug: 'the-science-of-active-recall',
    title: 'The Science of Active Recall: Why It Unlocks Long-Term Memory',
    excerpt:
      'Dive into the cognitive science behind active recall and learn why it is the most effective study technique for long-term retention.',
    date: '2025-07-10',
    author: 'John Smith, Cognitive Scientist',
    content: `
## What is Active Recall?

Active recall is the process of actively retrieving information from your memory, rather than passively reviewing it. Every time you bring a memory to the forefront of your mind, you strengthen the neural pathways associated with it.

## The Forgetting Curve

Pioneered by Hermann Ebbinghaus, the "forgetting curve" shows how quickly we forget information if we don't make a conscious effort to remember it. Active recall is the most powerful tool to combat this curve.

## How to Practice Active Recall

- **Flashcards:** The classic example. One side has a prompt, the other the answer.
- **Quizzing:** Testing yourself forces you to retrieve information under pressure.
- **Feynman Technique:** Trying to explain a concept in simple terms reveals gaps in your understanding and forces active recall.

FocusFlow AI's flashcard and quiz generation tools are built on this very principle, making it easy to integrate this powerful technique into your study routine.
`,
  },
];

export const getPostBySlug = (slug: string) => {
  return posts.find((post) => post.slug === slug);
};