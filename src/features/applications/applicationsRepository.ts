import { supabase } from '../../shared/db/supabaseClient';
import type { Animal, Application } from '../../shared/db/types';

export interface ApplicationError {
  message: string;
}

export async function findExistingApplication(
  userId: string,
  animalId: string
): Promise<{ application: Application | null; error: ApplicationError | null }> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .eq('animal_id', animalId)
    .maybeSingle();

  if (error) {
    return { application: null, error: { message: error.message } };
  }
  return { application: data, error: null };
}

/**
 * Creates the application record and triggers the send. The record is created as
 * 'pending' first (so it's never silently lost) then the Edge Function flips it to
 * 'submitted' or 'failed' once the send actually happens.
 */
export async function submitApplication(
  userId: string,
  animalId: string,
  shelterName: string | null
): Promise<{ application: Application | null; error: ApplicationError | null }> {
  const { data: inserted, error: insertError } = await supabase
    .from('applications')
    .insert({ user_id: userId, animal_id: animalId, shelter_name: shelterName, status: 'pending' })
    .select()
    .single();

  if (insertError) {
    return { application: null, error: { message: insertError.message } };
  }

  const { data: invokeData, error: invokeError } = await supabase.functions.invoke(
    'submit-application',
    { body: { applicationId: inserted.id } }
  );

  if (invokeError) {
    return { application: { ...inserted, status: 'failed' }, error: { message: invokeError.message } };
  }

  return { application: invokeData?.application ?? inserted, error: null };
}

export async function retryApplication(
  applicationId: string
): Promise<{ application: Application | null; error: ApplicationError | null }> {
  const { data: invokeData, error: invokeError } = await supabase.functions.invoke(
    'submit-application',
    { body: { applicationId } }
  );

  if (invokeError) {
    return { application: null, error: { message: invokeError.message } };
  }
  return { application: invokeData?.application ?? null, error: null };
}

export interface ApplicationWithAnimal extends Application {
  animal: Animal | null;
}

export async function fetchApplications(
  userId: string
): Promise<{ applications: ApplicationWithAnimal[]; error: ApplicationError | null }> {
  const { data, error } = await supabase
    .from('applications')
    .select('*, animal:animals(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { applications: [], error: { message: error.message } };
  }
  return { applications: (data as unknown as ApplicationWithAnimal[]) ?? [], error: null };
}
