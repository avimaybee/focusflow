'use server';// MIGRATED TO SUPABASE - These functions are being migrated

// Firebase imports have been removed as part of migration to Supabase

import { createClient } from '@supabase/supabase-js';

'use server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;/**

 * Creates a new study collection for a user.

/** * @param userId The ID of the user.

 * Creates a new study collection for a user. * @param title The title of the new collection.

 * @param userId The ID of the user. * @returns The ID of the newly created collection.

 * @param data Collection data including title, description, and visibility */

 * @returns The newly created collectionexport async function createCollection(userId: string, title: string): Promise<string> {

 */  console.log('[MIGRATED] createCollection called - not yet implemented with Supabase');

export async function createCollection(  // TODO: Implement with Supabase

  userId: string,  throw new Error('Collections feature is being migrated to Supabase');

  data: {}

    title: string;

    description?: string;/**

    is_public?: boolean; * Adds a piece of content to a study collection.

  } * @param userId The ID of the user.

) { * @param collectionId The ID of the collection.

  try { * @param contentId The ID of the content to add.

    const supabase = createClient(supabaseUrl, supabaseServiceKey); */

    export async function addContentToCollection(userId: string, collectionId: string, contentId: string): Promise<void> {

    const { data: collection, error } = await supabase  console.log('[MIGRATED] addContentToCollection called - not yet implemented with Supabase');

      .from('collections')  // TODO: Implement with Supabase

      .insert({  throw new Error('Collections feature is being migrated to Supabase');

        user_id: userId,}

        title: data.title,

        description: data.description,/**

        is_public: data.is_public || false, * Fetches all study collections for a user.

      }) * @param userId The ID of the user.

      .select() * @returns A list of the user's collections.

      .single(); */

export async function getCollections(userId: string) {

    if (error) {  console.log('[MIGRATED] getCollections called - not yet implemented with Supabase');

      console.error('Error creating collection:', error);  // TODO: Implement with Supabase

      throw new Error('Failed to create collection');  return [];

    }}


    return collection;
  } catch (err) {
    console.error('Exception in createCollection:', err);
    throw err;
  }
}

/**
 * Get all collections for a user
 */
export async function getCollections(
  userId: string,
  filters?: {
    is_public?: boolean;
    is_favorite?: boolean;
  }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let query = supabase
      .from('collections')
      .select(`
        *,
        collection_items (
          id,
          item_type,
          item_id,
          position
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public);
    }

    if (filters?.is_favorite !== undefined) {
      query = query.eq('is_favorite', filters.is_favorite);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching collections:', error);
      throw new Error('Failed to fetch collections');
    }

    return data || [];
  } catch (err) {
    console.error('Exception in getCollections:', err);
    throw err;
  }
}

/**
 * Get a single collection by ID with all its items populated
 */
export async function getCollectionById(userId: string, collectionId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: collection, error } = await supabase
      .from('collections')
      .select('*')
      .eq('id', collectionId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching collection:', error);
      throw new Error('Failed to fetch collection');
    }

    // Get all collection items
    const { data: items, error: itemsError } = await supabase
      .from('collection_items')
      .select('*')
      .eq('collection_id', collectionId)
      .order('position', { ascending: true });

    if (itemsError) {
      console.error('Error fetching collection items:', error);
      throw new Error('Failed to fetch collection items');
    }

    // Populate items with actual content
    const populatedItems = await Promise.all(
      (items || []).map(async (item: any) => {
        const tableName = getTableNameForItemType(item.item_type);
        if (!tableName) return item;

        const { data: content } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', item.item_id)
          .single();

        return {
          ...item,
          content,
        };
      })
    );

    return {
      ...collection,
      items: populatedItems,
    };
  } catch (err) {
    console.error('Exception in getCollectionById:', err);
    throw err;
  }
}

/**
 * Update a collection
 */
export async function updateCollection(
  userId: string,
  collectionId: string,
  updates: {
    title?: string;
    description?: string;
    is_public?: boolean;
    is_favorite?: boolean;
  }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', collectionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating collection:', error);
      throw new Error('Failed to update collection');
    }

    return data;
  } catch (err) {
    console.error('Exception in updateCollection:', err);
    throw err;
  }
}

/**
 * Delete a collection and all its items
 */
export async function deleteCollection(userId: string, collectionId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Delete collection items first (foreign key constraint)
    await supabase
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId);
    
    // Delete the collection
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting collection:', error);
      throw new Error('Failed to delete collection');
    }

    return { success: true };
  } catch (err) {
    console.error('Exception in deleteCollection:', err);
    throw err;
  }
}

/**
 * Add content to a collection
 */
export async function addContentToCollection(
  userId: string,
  collectionId: string,
  contentId: string,
  itemType: 'summary' | 'flashcard_set' | 'quiz' | 'study_plan' | 'practice_exam'
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user owns the collection
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('id')
      .eq('id', collectionId)
      .eq('user_id', userId)
      .single();

    if (collectionError || !collection) {
      throw new Error('Collection not found or access denied');
    }

    // Get the next position
    const { data: existingItems } = await supabase
      .from('collection_items')
      .select('position')
      .eq('collection_id', collectionId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = existingItems && existingItems.length > 0 
      ? (existingItems[0].position || 0) + 1 
      : 0;

    // Add the item
    const { data, error } = await supabase
      .from('collection_items')
      .insert({
        collection_id: collectionId,
        item_type: itemType,
        item_id: contentId,
        position: nextPosition,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding content to collection:', error);
      throw new Error('Failed to add content to collection');
    }

    return data;
  } catch (err) {
    console.error('Exception in addContentToCollection:', err);
    throw err;
  }
}

/**
 * Remove content from a collection
 */
export async function removeContentFromCollection(
  userId: string,
  collectionId: string,
  itemId: string
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user owns the collection
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('id')
      .eq('id', collectionId)
      .eq('user_id', userId)
      .single();

    if (collectionError || !collection) {
      throw new Error('Collection not found or access denied');
    }

    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('id', itemId)
      .eq('collection_id', collectionId);

    if (error) {
      console.error('Error removing content from collection:', error);
      throw new Error('Failed to remove content from collection');
    }

    return { success: true };
  } catch (err) {
    console.error('Exception in removeContentFromCollection:', err);
    throw err;
  }
}

/**
 * Reorder items in a collection
 */
export async function reorderCollectionItems(
  userId: string,
  collectionId: string,
  itemOrders: Array<{ itemId: string; position: number }>
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user owns the collection
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('id')
      .eq('id', collectionId)
      .eq('user_id', userId)
      .single();

    if (collectionError || !collection) {
      throw new Error('Collection not found or access denied');
    }

    // Update positions
    await Promise.all(
      itemOrders.map(({ itemId, position }) =>
        supabase
          .from('collection_items')
          .update({ position })
          .eq('id', itemId)
          .eq('collection_id', collectionId)
      )
    );

    return { success: true };
  } catch (err) {
    console.error('Exception in reorderCollectionItems:', err);
    throw err;
  }
}

/**
 * Make a collection public (generate slug)
 */
export async function makeCollectionPublic(userId: string, collectionId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Generate a unique slug
    const slug = `collection-${collectionId.slice(0, 8)}-${Date.now()}`;
    
    const { data, error } = await supabase
      .from('collections')
      .update({
        is_public: true,
        slug: slug,
      })
      .eq('id', collectionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error making collection public:', error);
      throw new Error('Failed to make collection public');
    }

    return data;
  } catch (err) {
    console.error('Exception in makeCollectionPublic:', err);
    throw err;
  }
}

/**
 * Get public collection by slug (no auth required)
 */
export async function getPublicCollection(slug: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: collection, error } = await supabase
      .from('collections')
      .select('*')
      .eq('slug', slug)
      .eq('is_public', true)
      .single();

    if (error) {
      console.error('Error fetching public collection:', error);
      throw new Error('Failed to fetch public collection');
    }

    // Get all collection items
    const { data: items, error: itemsError } = await supabase
      .from('collection_items')
      .select('*')
      .eq('collection_id', collection.id)
      .order('position', { ascending: true });

    if (itemsError) {
      console.error('Error fetching collection items:', error);
      throw new Error('Failed to fetch collection items');
    }

    // Populate items with actual content
    const populatedItems = await Promise.all(
      (items || []).map(async (item: any) => {
        const tableName = getTableNameForItemType(item.item_type);
        if (!tableName) return item;

        const { data: content } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', item.item_id)
          .single();

        return {
          ...item,
          content,
        };
      })
    );

    return {
      ...collection,
      items: populatedItems,
    };
  } catch (err) {
    console.error('Exception in getPublicCollection:', err);
    throw err;
  }
}

// Helper function to map item types to table names
function getTableNameForItemType(itemType: string): string | null {
  const typeMap: Record<string, string> = {
    summary: 'summaries',
    flashcard_set: 'flashcard_sets',
    quiz: 'quizzes',
    study_plan: 'study_plans',
    practice_exam: 'practice_exams',
  };

  return typeMap[itemType] || null;
}
