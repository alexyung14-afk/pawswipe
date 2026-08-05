import { supabase } from '../db/supabaseClient';
import type { Animal, AnimalSize, Species } from '../db/types';

export interface AnimalFilters {
  species?: Species;
  breed?: string;
  size?: AnimalSize;
  maxAgeYears?: number;
  location?: string;
}

export interface AnimalRepositoryError {
  message: string;
}

/**
 * Available animals the given user hasn't already liked, for the swipe deck.
 */
export async function fetchSwipeDeck(
  userId: string,
  filters: AnimalFilters = {}
): Promise<{ animals: Animal[]; error: AnimalRepositoryError | null }> {
  const { data: liked, error: likesError } = await supabase
    .from('likes')
    .select('animal_id')
    .eq('user_id', userId);

  if (likesError) {
    return { animals: [], error: { message: likesError.message } };
  }

  let query = supabase
    .from('animals')
    .select('*')
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  const excludeIds = (liked ?? []).map((row) => row.animal_id);
  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }
  if (filters.species) {
    query = query.eq('species', filters.species);
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
    return { animals: [], error: { message: error.message } };
  }
  return { animals: data ?? [], error: null };
}
