import { supabase } from '../../shared/db/supabaseClient';
import type { Dog } from '../../shared/db/types';

export interface LikesError {
  message: string;
}

export async function addToLikes(
  userId: string,
  dogId: string
): Promise<{ error: LikesError | null }> {
  const { error } = await supabase
    .from('likes')
    .upsert({ user_id: userId, dog_id: dogId }, { onConflict: 'user_id,dog_id', ignoreDuplicates: true });

  return { error: error ? { message: error.message } : null };
}

export async function removeFromLikes(
  userId: string,
  dogId: string
): Promise<{ error: LikesError | null }> {
  const { error } = await supabase.from('likes').delete().eq('user_id', userId).eq('dog_id', dogId);

  return { error: error ? { message: error.message } : null };
}

export async function fetchLikes(
  userId: string
): Promise<{ dogs: Dog[]; error: LikesError | null }> {
  const { data, error } = await supabase
    .from('likes')
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
