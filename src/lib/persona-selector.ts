'use server';

import { getPersonas, type Persona } from '@/lib/persona-actions';
import { PersonaIDs } from '@/lib/constants';

export interface PersonaSelectionResult {
  personaId: string;
  personaName: string;
  confidence: number;
  reason: string;
  method: 'explicit' | 'semantic' | 'fallback' | 'default';
}

// Confidence threshold - if below this, we still use the top result but log for monitoring
const MIN_CONFIDENCE_THRESHOLD = 0.3;

// Cache for persona embeddings to avoid recomputing
let personaEmbeddingsCache: Map<string, number[]> | null = null;
let personasCache: Persona[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Detect if the user explicitly requested a specific persona in their prompt
 * Looks for patterns like "as Gurt", "use Clairo", "with Dex", etc.
 */
function detectExplicitPersonaRequest(prompt: string, personas: Persona[]): Persona | null {
  const lowerPrompt = prompt.toLowerCase();
  
  // Common patterns for explicit persona requests
  const patterns = [
    /\bas\s+(\w+)/gi,           // "as Gurt"
    /\buse\s+(\w+)/gi,          // "use Clairo"
    /\bwith\s+(\w+)/gi,         // "with Dex"
    /\blike\s+(\w+)\s+would/gi, // "like Milo would"
    /\bin\s+(\w+)'s\s+style/gi, // "in Frank's style"
  ];

  for (const pattern of patterns) {
    const matches = [...lowerPrompt.matchAll(pattern)];
    for (const match of matches) {
      const candidateName = match[1];
      // Check if this matches any persona name (case-insensitive)
      const matchedPersona = personas.find(p => 
        p.name.toLowerCase() === candidateName.toLowerCase() ||
        p.display_name.toLowerCase().includes(candidateName.toLowerCase())
      );
      
      if (matchedPersona) {
        return matchedPersona;
      }
    }
  }

  return null;
}

/**
 * Simple text similarity using cosine similarity on character n-grams
 * This is a lightweight fallback when embeddings are not available
 */
function computeTextSimilarity(text1: string, text2: string): number {
  const ngrams = (text: string, n: number = 3): Set<string> => {
    const grams = new Set<string>();
    const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    for (let i = 0; i <= normalized.length - n; i++) {
      grams.add(normalized.slice(i, i + n));
    }
    return grams;
  };

  const grams1 = ngrams(text1);
  const grams2 = ngrams(text2);
  
  if (grams1.size === 0 || grams2.size === 0) return 0;

  const intersection = new Set([...grams1].filter(x => grams2.has(x)));
  const union = new Set([...grams1, ...grams2]);
  
  return intersection.size / union.size;
}

/**
 * Rule-based fallback selector using keyword matching
 * This is used when embeddings are unavailable or fail
 */
function fallbackKeywordSelector(prompt: string, personas: Persona[]): PersonaSelectionResult {
  const lowerPrompt = prompt.toLowerCase();
  
  // Define keyword patterns for each type of persona
  const keywordRules: Array<{
    keywords: string[];
    personaIdPattern: string;
    weight: number;
  }> = [
    // Essay writing
    {
      keywords: ['essay', 'write', 'paper', 'article', 'thesis', 'argument', 'persuasive', 'academic'],
      personaIdPattern: 'essay',
      weight: 1.0,
    },
    // Coding
    {
      keywords: ['code', 'program', 'function', 'debug', 'python', 'javascript', 'java', 'algorithm', 'implement'],
      personaIdPattern: 'code',
      weight: 1.0,
    },
    // ELI5 / Simple explanations
    {
      keywords: ['simple', 'explain like', 'eli5', 'basic', 'beginner', 'easy', 'understand', 'confused'],
      personaIdPattern: 'baby',
      weight: 1.0,
    },
    // Concise / Direct answers
    {
      keywords: ['quick', 'brief', 'concise', 'short', 'tldr', 'summary', 'bullet', 'direct'],
      personaIdPattern: 'straight',
      weight: 1.0,
    },
    // In-depth explanations
    {
      keywords: ['detail', 'depth', 'comprehensive', 'thorough', 'explain everything', 'deep dive', 'complete'],
      personaIdPattern: 'lore',
      weight: 1.0,
    },
    // Memory / Memorization
    {
      keywords: ['memorize', 'remember', 'mnemonic', 'recall', 'study tips', 'retention', 'flashcard'],
      personaIdPattern: 'memory',
      weight: 1.0,
    },
    // Creative / Brainstorming
    {
      keywords: ['idea', 'brainstorm', 'creative', 'think', 'suggest', 'alternative', 'possibilities'],
      personaIdPattern: 'idea',
      weight: 1.0,
    },
    // Exam strategy
    {
      keywords: ['exam', 'test', 'quiz', 'practice', 'prepare', 'strategy', 'study plan'],
      personaIdPattern: 'exam',
      weight: 1.0,
    },
  ];

  // Score each persona based on keyword matches
  const scores = new Map<string, number>();
  
  for (const rule of keywordRules) {
    let ruleScore = 0;
    for (const keyword of rule.keywords) {
      if (lowerPrompt.includes(keyword)) {
        ruleScore += rule.weight;
      }
    }
    
    if (ruleScore > 0) {
      // Find persona that matches this rule's pattern
      const matchingPersona = personas.find(p => 
        p.id.toLowerCase().includes(rule.personaIdPattern) ||
        p.name.toLowerCase().includes(rule.personaIdPattern)
      );
      
      if (matchingPersona) {
        scores.set(matchingPersona.id, (scores.get(matchingPersona.id) || 0) + ruleScore);
      }
    }
  }

  // Find the highest-scoring persona
  if (scores.size > 0) {
    const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
    const [personaId, score] = sorted[0];
    const persona = personas.find(p => p.id === personaId)!;
    
    return {
      personaId: persona.id,
      personaName: persona.name,
      confidence: Math.min(score / 3, 1.0), // Normalize to 0-1
      reason: `Keyword matching (${score.toFixed(1)} matches)`,
      method: 'fallback',
    };
  }

  // Ultimate fallback: return Gurt
  const defaultPersona = personas.find(p => p.id === PersonaIDs.GURT) || personas[0];
  return {
    personaId: defaultPersona.id,
    personaName: defaultPersona.name,
    confidence: 0.1,
    reason: 'No strong keyword matches, using default',
    method: 'default',
  };
}

/**
 * Generate a simple embedding vector for text using character frequency
 * This is a lightweight alternative to real embeddings (like OpenAI/Gemini embeddings)
 * For production, consider using a real embedding API
 */
async function generateSimpleEmbedding(text: string): Promise<number[]> {
  // Normalize text
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(w => w.length > 0);
  
  // Create a simple 100-dimensional vector based on text features
  const vector = new Array(100).fill(0);
  
  // Feature 1-26: Letter frequency
  for (const char of normalized) {
    const code = char.charCodeAt(0);
    if (code >= 97 && code <= 122) { // a-z
      vector[code - 97] += 1;
    }
  }
  
  // Feature 27-36: Common word stems
  const stems = ['writ', 'code', 'expl', 'summ', 'memo', 'idea', 'exam', 'stra', 'crea', 'simp'];
  stems.forEach((stem, idx) => {
    vector[26 + idx] = words.filter(w => w.startsWith(stem)).length;
  });
  
  // Feature 37-46: Sentence structure indicators
  vector[36] = (text.match(/\?/g) || []).length; // Questions
  vector[37] = (text.match(/\./g) || []).length; // Statements
  vector[38] = (text.match(/!/g) || []).length; // Exclamations
  vector[39] = words.length; // Word count
  vector[40] = text.length; // Character count
  
  // Normalize the vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) return 0;
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
  return magnitude > 0 ? dotProduct / magnitude : 0;
}

/**
 * Get or refresh the persona embeddings cache
 */
async function getPersonaEmbeddings(personas: Persona[]): Promise<Map<string, number[]>> {
  const now = Date.now();
  
  // Return cached embeddings if still valid
  if (
    personaEmbeddingsCache &&
    personasCache &&
    cacheTimestamp + CACHE_TTL_MS > now &&
    personasCache.length === personas.length
  ) {
    return personaEmbeddingsCache;
  }

  // Regenerate embeddings
  console.log('[persona-selector] Regenerating persona embeddings cache');
  const newCache = new Map<string, number[]>();
  
  for (const persona of personas) {
    // Exclude Auto persona from selection targets
    if (persona.id === PersonaIDs.AUTO) continue;
    
    // Combine description and name for embedding
    const textToEmbed = `${persona.display_name} ${persona.description}`;
    const embedding = await generateSimpleEmbedding(textToEmbed);
    newCache.set(persona.id, embedding);
  }

  personaEmbeddingsCache = newCache;
  personasCache = personas;
  cacheTimestamp = now;

  return newCache;
}

/**
 * Select the best persona using semantic similarity
 */
async function semanticSelector(prompt: string, personas: Persona[]): Promise<PersonaSelectionResult> {
  try {
    // Generate embedding for the user's prompt
    const promptEmbedding = await generateSimpleEmbedding(prompt);
    
    // Get persona embeddings
    const personaEmbeddings = await getPersonaEmbeddings(personas);
    
    // Calculate similarity scores
    const scores: Array<{ personaId: string; score: number }> = [];
    
    for (const [personaId, embedding] of personaEmbeddings.entries()) {
      const similarity = cosineSimilarity(promptEmbedding, embedding);
      scores.push({ personaId, score: similarity });
    }
    
    // Sort by score (descending)
    scores.sort((a, b) => b.score - a.score);
    
    if (scores.length === 0) {
      throw new Error('No personas available for selection');
    }

    // Get the top result
    const topResult = scores[0];
    const selectedPersona = personas.find(p => p.id === topResult.personaId)!;
    
    // Log if confidence is below threshold
    if (topResult.score < MIN_CONFIDENCE_THRESHOLD) {
      console.warn('[persona-selector] Low confidence selection', {
        personaId: selectedPersona.id,
        confidence: topResult.score,
        prompt: prompt.slice(0, 100),
      });
    }

    return {
      personaId: selectedPersona.id,
      personaName: selectedPersona.name,
      confidence: topResult.score,
      reason: `Semantic similarity: ${(topResult.score * 100).toFixed(1)}%`,
      method: 'semantic',
    };
  } catch (error) {
    console.error('[persona-selector] Semantic selection failed, using fallback', error);
    return fallbackKeywordSelector(prompt, personas);
  }
}

/**
 * Main persona selector function
 * 
 * Priority order:
 * 1. Explicit persona mentions in prompt
 * 2. Semantic similarity (embeddings)
 * 3. Keyword-based fallback
 * 4. Default persona (Gurt)
 */
export async function selectPersonaForPrompt(
  prompt: string,
  currentPersonaId?: string
): Promise<PersonaSelectionResult> {
  const startTime = Date.now();

  try {
    // Get all available personas (excluding Auto itself)
    const allPersonas = await getPersonas();
    const personas = allPersonas.filter(p => p.id !== PersonaIDs.AUTO);

    if (personas.length === 0) {
      throw new Error('No personas available');
    }

    // PRIORITY 1: Check for explicit persona requests
    const explicitPersona = detectExplicitPersonaRequest(prompt, personas);
    if (explicitPersona) {
      const elapsed = Date.now() - startTime;
      console.log('[persona-selector] Explicit persona detected', {
        personaId: explicitPersona.id,
        latency: `${elapsed}ms`,
      });

      return {
        personaId: explicitPersona.id,
        personaName: explicitPersona.name,
        confidence: 1.0,
        reason: 'Explicit mention in prompt',
        method: 'explicit',
      };
    }

    // PRIORITY 2: Semantic similarity selection
    const result = await semanticSelector(prompt, personas);
    
    const elapsed = Date.now() - startTime;
    console.log('[persona-selector] Persona selected', {
      personaId: result.personaId,
      method: result.method,
      confidence: result.confidence.toFixed(3),
      latency: `${elapsed}ms`,
    });

    return result;
  } catch (error) {
    console.error('[persona-selector] Critical error in persona selection', error);
    
    // Ultimate fallback
    const personas = await getPersonas();
    const defaultPersona = personas.find(p => p.id === PersonaIDs.GURT) || personas[0];
    
    return {
      personaId: defaultPersona.id,
      personaName: defaultPersona.name,
      confidence: 0,
      reason: `Error during selection: ${error}`,
      method: 'default',
    };
  }
}

/**
 * Invalidate the persona embeddings cache
 * Call this when personas are updated
 */
export async function invalidatePersonaCache(): Promise<void> {
  personaEmbeddingsCache = null;
  personasCache = null;
  cacheTimestamp = 0;
  console.log('[persona-selector] Cache invalidated');
}
