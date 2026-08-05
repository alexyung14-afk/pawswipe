import { supabase } from '../db/supabaseClient';
import type { Dog, DogSize } from '../db/types';

export interface DogFilters {
  breed?: string;
  size?: DogSize;
  maxAgeYears?: number;
}

export interface DogRepositoryError {
  message: string;
}

export async function fetchAvailableDogs(
  filters: DogFilters = {}
): Promise<{ dogs: Dog[]; error: DogRepositoryError | null }> {
  let query = supabase
    .from('dogs')
    .select('*')
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (filters.breed) {
    query = query.ilike('breed', `%${filters.breed}%`);
  }
  if (filters.size) {
    query = query.eq('size', filters.size);
  }
  if (filters.maxAgeYears !== undefined) {
    query = query.lte('age_years', filters.maxAgeYears);
  }

  const { data, error } = await query;

  if (error) {
    return { dogs: [], error: { message: error.message } };
  }
  return { dogs: data ?? [], error: null };
}
