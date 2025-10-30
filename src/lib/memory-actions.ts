'use server';// MIGRATED TO SUPABASE - This feature is being migrated

// Firebase imports have been removed as part of migration to Supabase

import { createClient } from '@supabase/supabase-js';

export interface AiMemory {

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;  topics: string[];

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;  preferences: string[];

}

export interface AiMemory {

  id?: string;const initialMemory: AiMemory = {

  type: 'fact' | 'preference' | 'context' | 'goal';  topics: [],

  content: string;  preferences: [],

  importance: number; // 1-10};

  tags?: string[];

  relatedTopics?: string[];/**

  createdAt?: string; * Retrieves the user's AI memory from Firestore.

  lastAccessedAt?: string; * @param uid The user's ID.

} * @returns The AiMemory object, or an initial empty object if not found.

 */

/**export async function getMemory(uid: string): Promise<AiMemory> {

 * Save a new memory for the AI  console.log('[MIGRATED] getMemory called - returning initial memory');

 */  // TODO: Implement with Supabase when needed

export async function saveMemory(  return initialMemory;

  userId: string,}

  memory: {

    type: 'fact' | 'preference' | 'context' | 'goal';/**

    content: string; * Saves the user's AI memory to Firestore.

    importance?: number; * @param uid The user's ID.

    tags?: string[]; * @param memory The AiMemory object to save.

    relatedTopics?: string[]; */

  }export async function saveMemory(uid: string, memory: AiMemory): Promise<void> {

) {  console.log('[MIGRATED] saveMemory called - not yet implemented with Supabase');

  try {  // TODO: Implement with Supabase when needed

    const supabase = createClient(supabaseUrl, supabaseServiceKey);}

    
    const { data, error } = await supabase
      .from('ai_memory')
      .insert({
        user_id: userId,
        memory_type: memory.type,
        content: memory.content,
        importance: memory.importance || 5,
        tags: memory.tags || [],
        related_topics: memory.relatedTopics || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving memory:', error);
      throw new Error('Failed to save memory');
    }

    return data;
  } catch (err) {
    console.error('Exception in saveMemory:', err);
    throw err;
  }
}

/**
 * Get all memories for a user
 */
export async function getMemories(
  userId: string,
  filters?: {
    type?: 'fact' | 'preference' | 'context' | 'goal';
    tags?: string[];
    minImportance?: number;
    limit?: number;
  }
): Promise<AiMemory[]> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let query = supabase
      .from('ai_memory')
      .select('*')
      .eq('user_id', userId)
      .order('importance', { ascending: false })
      .order('last_accessed_at', { ascending: false });

    if (filters?.type) {
      query = query.eq('memory_type', filters.type);
    }

    if (filters?.minImportance) {
      query = query.gte('importance', filters.minImportance);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching memories:', error);
      throw new Error('Failed to fetch memories');
    }

    // Update last accessed time for retrieved memories
    if (data && data.length > 0) {
      const memoryIds = data.map((m: any) => m.id);
      await supabase
        .from('ai_memory')
        .update({ last_accessed_at: new Date().toISOString() })
        .in('id', memoryIds);
    }

    return (data || []).map((m: any) => ({
      id: m.id,
      type: m.memory_type,
      content: m.content,
      importance: m.importance,
      tags: m.tags,
      relatedTopics: m.related_topics,
      createdAt: m.created_at,
      lastAccessedAt: m.last_accessed_at,
    }));
  } catch (err) {
    console.error('Exception in getMemories:', err);
    return [];
  }
}

/**
 * Get relevant memories for a topic (semantic search)
 */
export async function getRelevantMemories(
  userId: string,
  topic: string,
  limit: number = 10
): Promise<AiMemory[]> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get memories that contain the topic in content or related topics
    const { data, error } = await supabase
      .from('ai_memory')
      .select('*')
      .eq('user_id', userId)
      .or(`content.ilike.%${topic}%,related_topics.cs.{${topic}}`)
      .order('importance', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching relevant memories:', error);
      return [];
    }

    // Update last accessed time
    if (data && data.length > 0) {
      const memoryIds = data.map((m: any) => m.id);
      await supabase
        .from('ai_memory')
        .update({ last_accessed_at: new Date().toISOString() })
        .in('id', memoryIds);
    }

    return (data || []).map((m: any) => ({
      id: m.id,
      type: m.memory_type,
      content: m.content,
      importance: m.importance,
      tags: m.tags,
      relatedTopics: m.related_topics,
      createdAt: m.created_at,
      lastAccessedAt: m.last_accessed_at,
    }));
  } catch (err) {
    console.error('Exception in getRelevantMemories:', err);
    return [];
  }
}

/**
 * Update a memory's importance
 */
export async function updateMemoryImportance(
  userId: string,
  memoryId: string,
  importance: number
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('ai_memory')
      .update({ importance })
      .eq('id', memoryId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating memory importance:', error);
      throw new Error('Failed to update memory importance');
    }

    return data;
  } catch (err) {
    console.error('Exception in updateMemoryImportance:', err);
    throw err;
  }
}

/**
 * Update a memory's content
 */
export async function updateMemory(
  userId: string,
  memoryId: string,
  updates: {
    content?: string;
    importance?: number;
    tags?: string[];
    relatedTopics?: string[];
  }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const updateData: any = {};
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.importance !== undefined) updateData.importance = updates.importance;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.relatedTopics !== undefined) updateData.related_topics = updates.relatedTopics;

    const { data, error } = await supabase
      .from('ai_memory')
      .update(updateData)
      .eq('id', memoryId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating memory:', error);
      throw new Error('Failed to update memory');
    }

    return data;
  } catch (err) {
    console.error('Exception in updateMemory:', err);
    throw err;
  }
}

/**
 * Delete a memory
 */
export async function deleteMemory(userId: string, memoryId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('ai_memory')
      .delete()
      .eq('id', memoryId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting memory:', error);
      throw new Error('Failed to delete memory');
    }

    return { success: true };
  } catch (err) {
    console.error('Exception in deleteMemory:', err);
    throw err;
  }
}

/**
 * Clean up old, low-importance memories (LRU eviction)
 * Keeps max 100 memories, removing oldest/least important
 */
export async function cleanupMemories(userId: string, maxMemories: number = 100) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get count of memories
    const { count, error: countError } = await supabase
      .from('ai_memory')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError || !count || count <= maxMemories) {
      return { success: true, deletedCount: 0 };
    }

    // Get memories to delete (oldest, least important)
    const toDelete = count - maxMemories;
    
    const { data: memoriesToDelete, error: fetchError } = await supabase
      .from('ai_memory')
      .select('id')
      .eq('user_id', userId)
      .order('importance', { ascending: true })
      .order('last_accessed_at', { ascending: true })
      .limit(toDelete);

    if (fetchError || !memoriesToDelete) {
      console.error('Error fetching memories to delete:', fetchError);
      return { success: false, deletedCount: 0 };
    }

    const idsToDelete = memoriesToDelete.map((m: any) => m.id);
    
    const { error: deleteError } = await supabase
      .from('ai_memory')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      console.error('Error deleting memories:', deleteError);
      throw new Error('Failed to cleanup memories');
    }

    return { success: true, deletedCount: idsToDelete.length };
  } catch (err) {
    console.error('Exception in cleanupMemories:', err);
    return { success: false, deletedCount: 0 };
  }
}

/**
 * Get memory statistics
 */
export async function getMemoryStats(userId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('ai_memory')
      .select('memory_type, importance')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching memory stats:', error);
      return {
        total: 0,
        byType: {},
        averageImportance: 0,
      };
    }

    const memories = data || [];
    const byType: Record<string, number> = {};
    let totalImportance = 0;

    memories.forEach((m: any) => {
      byType[m.memory_type] = (byType[m.memory_type] || 0) + 1;
      totalImportance += m.importance || 0;
    });

    return {
      total: memories.length,
      byType,
      averageImportance: memories.length > 0 ? totalImportance / memories.length : 0,
    };
  } catch (err) {
    console.error('Exception in getMemoryStats:', err);
    return {
      total: 0,
      byType: {},
      averageImportance: 0,
    };
  }
}
