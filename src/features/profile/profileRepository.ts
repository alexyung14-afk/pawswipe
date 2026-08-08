import { supabase } from '../../shared/db/supabaseClient';
import type { AdopterProfile } from '../../shared/db/types';

export interface ProfileError {
  message: string;
}

export interface ProfileInput {
  housing_type: string | null;
  has_yard: boolean | null;
  yard_fenced: boolean | null;
  work_schedule: string | null;
  household_members: string | null;
  pet_experience: string | null;
  references: string | null;
}

export async function fetchProfile(
  userId: string
): Promise<{ profile: AdopterProfile | null; error: ProfileError | null }> {
  const { data, error } = await supabase
    .from('adopter_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return { profile: null, error: { message: error.message } };
  }
  return { profile: data, error: null };
}

export async function saveProfile(
  userId: string,
  input: ProfileInput
): Promise<{ error: ProfileError | null }> {
  const { error } = await supabase.from('adopter_profiles').upsert(
    {
      user_id: userId,
      housing_type: input.housing_type,
      has_yard: input.has_yard,
      yard_fenced: input.yard_fenced,
      work_schedule: input.work_schedule,
      household_members: input.household_members ? { notes: input.household_members } : null,
      pet_experience: input.pet_experience,
      references: input.references ? { notes: input.references } : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  return { error: error ? { message: error.message } : null };
}

export function isProfileComplete(profile: AdopterProfile | null): boolean {
  if (!profile) return false;
  return Boolean(
    profile.housing_type && profile.work_schedule && profile.pet_experience && profile.references
  );
}
