// src/ai/flows/chat-flow.ts
'use server';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chat = void 0;
const genkit_1 = require("../genkit");
const zod_1 = require("zod");
const marked_1 = require("marked");
const tools_1 = require("./tools");
const chat_types_1 = require("./chat-types");
const firestore_session_store_1 = require("@/lib/firestore-session-store");
const googleai_1 = require("@genkit-ai/googleai");
exports.chat = genkit_1.ai.defineFlow({
    name: 'chatFlow',
    inputSchema: chat_types_1.ChatInputSchema,
    outputSchema: zod_1.z.object({
        response: zod_1.z.string(),
        rawResponse: zod_1.z.string(),
        sessionId: zod_1.z.string(),
    }),
}, async (input) => {
    const { message, sessionId, persona, context, image } = input;
    const store = new firestore_session_store_1.FirestoreSessionStore();
    const session = sessionId
        ? await genkit_1.ai.loadSession(sessionId, { store })
        : genkit_1.ai.createSession({ store });
    const model = googleai_1.googleAI.model('gemini-1.5-flash');
    const chat = session.chat({
        model,
        tools: [
            tools_1.summarizeNotesTool,
            tools_1.createStudyPlanTool,
            tools_1.createFlashcardsTool,
            tools_1.createQuizTool,
            tools_1.explainConceptTool,
            tools_1.createMemoryAidTool,
            tools_1.createDiscussionPromptsTool,
            tools_1.highlightKeyInsightsTool,
        ],
        system: `You are an expert AI assistant and a helpful, conversational study partner. Your persona is ${persona}. Your responses should be well-structured and use markdown for formatting. If you need information from the user to use a tool (like source text for a quiz), and the user does not provide it, you must explain clearly why you need it and suggest ways the user can provide it. When you use a tool, the output will be a JSON string. You should then present this information to the user in a clear, readable format.`,
    });
    const prompt = [{ text: message }];
    if (context) {
        prompt.unshift({ text: `CONTEXT:\n${context}\n\nUSER'S REQUEST:\n` });
    }
    if (image) {
        prompt.push({ media: { url: image, contentType: 'image/*' } });
    }
    const response = await chat.send(prompt);
    const responseText = response.text;
    const formattedResponse = await marked_1.marked.parse(responseText);
    return {
        response: formattedResponse,
        rawResponse: responseText,
        sessionId: session.id,
    };
});
//# sourceMappingURL=chat-flow.js.map