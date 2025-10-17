// MIGRATED TO SUPABASE - This feature is being migrated
// Firebase imports have been removed as part of migration to Supabase

export interface AiMemory {
  topics: string[];
  preferences: string[];
}

const initialMemory: AiMemory = {
  topics: [],
  preferences: [],
};

/**
 * Retrieves the user's AI memory from Firestore.
 * @param uid The user's ID.
 * @returns The AiMemory object, or an initial empty object if not found.
 */
export async function getMemory(uid: string): Promise<AiMemory> {
  console.log('[MIGRATED] getMemory called - returning initial memory');
  // TODO: Implement with Supabase when needed
  return initialMemory;
}

/**
 * Saves the user's AI memory to Firestore.
 * @param uid The user's ID.
 * @param memory The AiMemory object to save.
 */
export async function saveMemory(uid: string, memory: AiMemory): Promise<void> {
  console.log('[MIGRATED] saveMemory called - not yet implemented with Supabase');
  // TODO: Implement with Supabase when needed
}
