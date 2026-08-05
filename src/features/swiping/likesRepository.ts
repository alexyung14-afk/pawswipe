import { supabase } from '../../shared/db/supabaseClient';
import type { Animal } from '../../shared/db/types';

export interface LikesError {
  message: string;
}

export async function addToLikes(
  userId: string,
  animalId: string
): Promise<{ error: LikesError | null }> {
  const { error } = await supabase
    .from('likes')
    .upsert(
      { user_id: userId, animal_id: animalId },
      { onConflict: 'user_id,animal_id', ignoreDuplicates: true }
    );

  return { error: error ? { message: error.message } : null };
}

export async function removeFromLikes(
  userId: string,
  animalId: string
): Promise<{ error: LikesError | null }> {
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', userId)
    .eq('animal_id', animalId);

  return { error: error ? { message: error.message } : null };
}

export async function fetchLikes(
  userId: string
): Promise<{ animals: Animal[]; error: LikesError | null }> {
  const { data, error } = await supabase
    .from('likes')
    .select('created_at, animals(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { animals: [], error: { message: error.message } };
  }

  const animals = (data ?? [])
    .map((row) => row.animals as unknown as Animal | null)
    .filter((animal): animal is Animal => animal !== null);

  return { animals, error: null };
}
