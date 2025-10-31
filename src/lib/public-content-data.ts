// Functions to fetch all public content for sitemap generation
'use server';

import { supabase } from './supabase';

export async function getPublicSummaries() {
  try {
    const { data, error } = await supabase
      .from('summaries')
      .select('slug, updated_at')
      .eq('is_public', true)
      .not('slug', 'is', null);

    if (error) {
      console.error('[getPublicSummaries] Error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getPublicSummaries] Unexpected error:', error);
    return [];
  }
}

export async function getPublicFlashcardSets() {
  try {
    const { data, error } = await supabase
      .from('flashcard_sets')
      .select('slug, updated_at')
      .eq('is_public', true)
      .not('slug', 'is', null);

    if (error) {
      console.error('[getPublicFlashcardSets] Error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getPublicFlashcardSets] Unexpected error:', error);
    return [];
  }
}

export async function getPublicQuizzes() {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('slug, updated_at')
      .eq('is_public', true)
      .not('slug', 'is', null);

    if (error) {
      console.error('[getPublicQuizzes] Error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getPublicQuizzes] Unexpected error:', error);
    return [];
  }
}

export async function getPublicStudyPlans() {
  try {
    const { data, error } = await supabase
      .from('study_plans')
      .select('slug, updated_at')
      .eq('is_public', true)
      .not('slug', 'is', null);

    if (error) {
      console.error('[getPublicStudyPlans] Error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getPublicStudyPlans] Unexpected error:', error);
    return [];
  }
}

export async function getAllUsernames() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .not('username', 'is', null);

    if (error) {
      console.error('[getAllUsernames] Error:', error);
      return [];
    }

    return (data || []).map(profile => profile.username).filter(Boolean);
  } catch (error) {
    console.error('[getAllUsernames] Unexpected error:', error);
    return [];
  }
}
