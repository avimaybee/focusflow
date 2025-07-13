/**
 * @fileoverview This file defines the RAG (Retrieval-Augmented Generation) flow
 * for chatting with documents, particularly PDFs.
 */
"use server";
import {ai} from "./genkit";
import {z} from "zod";
import * as pdf from "pdf-parse";
import {Document, documentSchema} from "genkit";
import {langchain} from "genkitx-langchain";
import {RecursiveCharacterTextSplitter} from "langchain/text_splitter";
import {devVectorStore} from "genkitx-dev-vectorstore";
import {googleAI}s from "genkitx-googleai";

// Define text embedding model
const textEmbedding = googleAI.textEmbedding("text-embedding-004");

export const indexAndAnswer = ai.defineFlow(
  {
    name: "indexAndAnswer",
    inputSchema: z.object({
      document: z.string().describe("A document provided as a data URI"),
      question: z.string().describe("The question to answer"),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    // 1. Extract text from the PDF data URI
    const buffer = Buffer.from(
      input.document.substring(input.document.indexOf(",") + 1),
      "base64"
    );
    const data = await pdf(buffer);
    const pdfDocument = Document.fromText(data.text, data.info);

    // 2. Split the document text into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 512,
      chunkOverlap: 64,
    });
    const chunks = await splitter.splitDocuments([
      langchain.toLangChainDocument(pdfDocument),
    ]);
    const genkitChunks = chunks.map(langchain.fromLangChainDocument);

    // 3. Index the chunks in the development vector store
    const store = devVectorStore({
      embedder: textEmbedding,
    });
    await store.add(genkitChunks);

    // 4. Retrieve relevant chunks based on the user's question
    const searchResult = await store.retrieve({
      text: input.question,
      options: {k: 3}, // Retrieve top 3 most relevant chunks
    });

    // 5. Generate an answer using the retrieved context
    const {output} = await ai.generate({
      prompt: `You are an expert at answering questions about the provided document.
        Answer the user's question based on the following context.
        If the answer is not available in the context, say "I am not able to answer this question."

        CONTEXT:
        ${searchResult.map((r) => r.text()).join("\n---\n")}

        QUESTION:
        ${input.question}
        `,
      model: "googleai/gemini-1.5-flash",
      output: {
        schema: z.string(),
      },
    });
    
    return output!;
  }
);
