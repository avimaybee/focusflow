import {z} from 'genkit';

export const PersonaSchema = z.enum(['neutral', 'tutor', 'creative']);
export type Persona = z.infer<typeof PersonaSchema>;

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string(),
});

export const ChatInputSchema = z.object({
  persona: PersonaSchema,
  history: z.array(ChatMessageSchema),
  message: z.string(),
  image: z
    .string()
    .optional()
    .describe(
      "An optional image provided by the student (e.g., a photo of a math problem), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  context: z
    .string()
    .optional()
    .describe(
      'Optional context, like text from a document, to be used by a tool.'
    ),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export const ChatOutputSchema = z.object({
  response: z.string().describe("The AI tutor's helpful response."),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;
