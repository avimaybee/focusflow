// src/lib/gemini-client.ts
/**
 * Centralized Gemini AI client using the official Google GenAI SDK
 * Provides stateful chat sessions, file upload capabilities, and rate limiting
 */

import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

// Create singleton instance
export const geminiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

/**
 * Default model to use for chat
 * Using gemini-2.5-flash - Latest stable model (June 2025)
 * Best for price-performance with thinking capabilities
 */
export const DEFAULT_CHAT_MODEL = 'gemini-2.5-flash';

/**
 * Supported file MIME types for multimodal input
 */
export const SUPPORTED_FILE_TYPES = {
  images: ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'],
  documents: ['application/pdf'],
  audio: ['audio/wav', 'audio/mp3', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac'],
  video: ['video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/x-flv', 'video/mpg', 'video/webm', 'video/wmv', 'video/3gpp'],
} as const;

export const ALL_SUPPORTED_MIME_TYPES = [
  ...SUPPORTED_FILE_TYPES.images,
  ...SUPPORTED_FILE_TYPES.documents,
  ...SUPPORTED_FILE_TYPES.audio,
  ...SUPPORTED_FILE_TYPES.video,
];

/**
 * Rate limiting configuration
 * Gemini API free tier: 15 RPM (requests per minute)
 * Gemini API paid tier: 1000 RPM
 * Using conservative limits to avoid 429 errors
 */
const RATE_LIMIT = {
  maxRequests: 10, // Max 10 requests per minute (conservative)
  windowMs: 60000, // 1 minute window
  minDelayMs: 1000, // Minimum 1 second between requests
};

// Request tracking for rate limiting
let requestTimestamps: number[] = [];

/**
 * Rate limiter with exponential backoff
 */
async function waitForRateLimit(retryCount = 0): Promise<void> {
  const now = Date.now();
  
  // Remove timestamps older than the window
  requestTimestamps = requestTimestamps.filter(
    timestamp => now - timestamp < RATE_LIMIT.windowMs
  );
  
  // If we're at the limit, wait
  if (requestTimestamps.length >= RATE_LIMIT.maxRequests) {
    const oldestRequest = requestTimestamps[0];
    const waitTime = RATE_LIMIT.windowMs - (now - oldestRequest);
    console.log(`[rate-limit] Rate limit reached. Waiting ${waitTime}ms before next request...`);
    await new Promise(resolve => setTimeout(resolve, waitTime + 100));
    return waitForRateLimit(retryCount); // Recursively check again
  }
  
  // If there was a recent request, enforce minimum delay
  if (requestTimestamps.length > 0) {
    const lastRequest = requestTimestamps[requestTimestamps.length - 1];
    const timeSinceLastRequest = now - lastRequest;
    
    if (timeSinceLastRequest < RATE_LIMIT.minDelayMs) {
      const waitTime = RATE_LIMIT.minDelayMs - timeSinceLastRequest;
      console.log(`[rate-limit] Enforcing minimum delay of ${waitTime}ms between requests...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  // Add exponential backoff for retries
  if (retryCount > 0) {
    const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30s
    console.log(`[rate-limit] Retry ${retryCount}: Waiting ${backoffMs}ms (exponential backoff)...`);
    await new Promise(resolve => setTimeout(resolve, backoffMs));
  }
  
  // Record this request
  requestTimestamps.push(Date.now());
}

/**
 * Retry wrapper with exponential backoff for rate limit errors
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  retryCount = 0
): Promise<T> {
  try {
    await waitForRateLimit(retryCount);
    return await fn();
  } catch (error: any) {
    const is429 = error?.message?.includes('429') || 
                  error?.message?.toLowerCase().includes('rate limit') ||
                  error?.message?.toLowerCase().includes('quota') ||
                  error?.message?.toLowerCase().includes('overloaded');
    
    if (is429 && retryCount < maxRetries) {
      console.error(`[rate-limit] Rate limit error (attempt ${retryCount + 1}/${maxRetries + 1}):`, error?.message);
      return retryWithBackoff(fn, maxRetries, retryCount + 1);
    }
    
    throw error;
  }
}

/**
 * Upload a file to Gemini API and get a URI for use in chat
 * @param file - The file to upload (path for server-side, File for client-side)
 * @param mimeType - The MIME type of the file
 * @returns The uploaded file object with URI
 */
export async function uploadFileToGemini(file: string | Buffer, mimeType: string) {
  if (!ALL_SUPPORTED_MIME_TYPES.includes(mimeType as any)) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  return retryWithBackoff(async () => {
    try {
      const uploadedFile = await geminiClient.files.upload({
        file: file as any, // SDK accepts string or Buffer despite type definition
        config: { mimeType },
      });

      console.log('[gemini-client] File uploaded successfully:', uploadedFile.uri);
      return uploadedFile;
    } catch (error) {
      console.error('[gemini-client] File upload failed:', error);
      throw error;
    }
  });
}

/**
 * Convert a local file path to a Part object for inline data embedding
 * Useful for smaller files that don't need separate upload
 */
export function createInlineDataPart(data: string, mimeType: string) {
  return {
    inlineData: {
      data,
      mimeType,
    },
  };
}

/**
 * Create a Part object from an uploaded file URI
 */
export function createFileDataPart(fileUri: string, mimeType: string) {
  return {
    fileData: {
      fileUri,
      mimeType,
    },
  };
}

/**
 * Model context window limits (in tokens)
 */
export const MODEL_LIMITS = {
  'gemini-2.5-flash': 1048576, // 1,048,576 token input limit (stable model)
  'gemini-2.0-flash-exp': 1000000,
  'gemini-1.5-flash': 1000000,
  'gemini-1.5-pro': 2000000,
} as const;

/**
 * Create a stateful chat session with the Gemini model
 * @param config - Chat configuration (temperature, tokens, system instructions, history)
 * @returns A chat session instance with rate limiting
 */
export function createChatSession(config: {
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
  history?: Array<{ role: string; text: string }>;
  model?: string;
}) {
  const {
    temperature = 0.7,
    maxOutputTokens = 8192,
    systemInstruction,
    history = [],
    model = DEFAULT_CHAT_MODEL, // Use latest thinking model by default
  } = config;

  // Convert history to SDK format
  const historyMessages = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  // Create chat session with the official SDK
  const chat = geminiClient.chats.create({
    model,
    config: {
      temperature,
      maxOutputTokens,
      systemInstruction,
    },
    history: historyMessages,
  });

  console.log('[gemini-client] Created chat session with model', model, ',', historyMessages.length, 'history messages');

  // Wrap the sendMessage method to add rate limiting
  const originalSendMessage = chat.sendMessage.bind(chat);
  (chat.sendMessage as any) = async (...args: any[]) => {
    return retryWithBackoff(() => (originalSendMessage as any)(...args));
  };

  return chat;
}
