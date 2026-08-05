import { supabase } from '../../shared/db/supabaseClient';
import type { Dog } from '../../shared/db/types';

export interface ShortlistError {
  message: string;
}

export async function addToShortlist(
  userId: string,
  dogId: string
): Promise<{ error: ShortlistError | null }> {
  const { error } = await supabase
    .from('shortlist_entries')
    .upsert({ user_id: userId, dog_id: dogId }, { onConflict: 'user_id,dog_id', ignoreDuplicates: true });

  return { error: error ? { message: error.message } : null };
}

export async function fetchShortlist(
  userId: string
): Promise<{ dogs: Dog[]; error: ShortlistError | null }> {
  const { data, error } = await supabase
    .from('shortlist_entries')
    .select('created_at, dogs(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { dogs: [], error: { message: error.message } };
  }

  const dogs = (data ?? [])
    .map((row) => row.dogs as unknown as Dog | null)
    .filter((dog): dog is Dog => dog !== null);

  return { dogs, error: null };
}
