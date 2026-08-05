import { supabase } from '../db/supabaseClient';
import type { Dog, DogSize } from '../db/types';

export interface DogFilters {
  breed?: string;
  size?: DogSize;
  maxAgeYears?: number;
  location?: string;
}

export interface DogRepositoryError {
  message: string;
}

/**
 * Available dogs the given user hasn't already shortlisted, for the swipe deck.
 */
export async function fetchSwipeDeck(
  userId: string,
  filters: DogFilters = {}
): Promise<{ dogs: Dog[]; error: DogRepositoryError | null }> {
  const { data: shortlisted, error: shortlistError } = await supabase
    .from('shortlist_entries')
    .select('dog_id')
    .eq('user_id', userId);

  if (shortlistError) {
    return { dogs: [], error: { message: shortlistError.message } };
  }

  let query = supabase
    .from('dogs')
    .select('*')
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  const excludeIds = (shortlisted ?? []).map((row) => row.dog_id);
  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }
  if (filters.breed) {
    query = query.ilike('breed', `%${filters.breed}%`);
  }
  if (filters.size) {
    query = query.eq('size', filters.size);
  }
  if (filters.maxAgeYears !== undefined) {
    query = query.lte('age_years', filters.maxAgeYears);
  }
  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { dogs: [], error: { message: error.message } };
  }
  return { dogs: data ?? [], error: null };
}
