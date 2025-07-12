// src/ai/summarizer.ts
import { ai } from './genkit';
import { selectModel } from './model-selection';

// A simple text chunker
function chunkText(text: string, chunkSize = 8000, overlap = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.slice(i, end));
    i += chunkSize - overlap;
  }
  return chunks;
}

export async function summarizeTextMapReduce(textToSummarize: string): Promise<string> {
  if (!textToSummarize) {
    return "I can't summarize an empty document.";
  }

  const textChunks = chunkText(textToSummarize);
  const model = selectModel(textToSummarize, [], false); // Use a basic model for summarization

  // 1. Map Step: Summarize each chunk individually
  const chunkSummaries = await Promise.all(
    textChunks.map(async (chunk) => {
      const prompt = `Summarize the following text concisely:\n\n---\n${chunk}\n---\n\nSummary:`;
      const result = await ai.generate({
        model,
        prompt: {
          text: prompt,
        },
        config: {
          temperature: 0.3,
        },
      });
      return result.text();
    })
  );

  // 2. Reduce Step: Combine the summaries into a final summary
  const combinedSummaries = chunkSummaries.join('\n\n');
  const finalPrompt = `The following are multiple summaries of different parts of a long document. Combine them into a single, coherent, and well-structured final summary that captures the key points of the entire document.\n\n---\n${combinedSummaries}\n---\n\nFinal Summary:`;
  
  const finalResult = await ai.generate({
    model,
    prompt: {
      text: finalPrompt,
    },
    config: {
      temperature: 0.5,
    },
  });

  return finalResult.text();
}
