// Scheduled sync job (see docs/PLAN.md section 7 and 12's cost warning): pulls available
// animals from RescueGroups.org and upserts them into our own `animals` table, so the app
// never hits a provider live on every swipe. Runs on a schedule (Supabase Cron), not per-request.
//
// Secrets required (set via `supabase secrets set`):
//   RESCUEGROUPS_API_KEY   — from rescuegroups.org/services/adoptable-pet-data-api
// Auto-provided by Supabase Edge Functions:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// NOTE: only 'dogs' and 'cats' are wired up below -- those are the two species.plural values
// we could confirm with reasonable confidence. RescueGroups' exact taxonomy for other species
// (rabbits, birds, etc.) isn't verified against the real API yet, so 'other' isn't synced here.
// 'other' still works as an app-level filter value for manually-added/seed animals; add its
// RescueGroups query once the key is live and the real species list can be checked.

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const RESCUEGROUPS_BASE_URL = 'https://api.rescuegroups.org/v5/public/animals/search/available/';

type OurSpecies = 'dog' | 'cat' | 'other';

const SPECIES_TO_SYNC: { rescueGroupsPlural: string; ourSpecies: OurSpecies }[] = [
  { rescueGroupsPlural: 'dogs', ourSpecies: 'dog' },
  { rescueGroupsPlural: 'cats', ourSpecies: 'cat' },
];

interface RescueGroupsAnimal {
  id: string;
  type: string;
  attributes: {
    name?: string;
    breedPrimary?: string;
    ageGroup?: string;
    sizeGroup?: string;
    descriptionText?: string;
    pictureThumbnailUrl?: string;
  };
  relationships?: {
    orgs?: { data?: { id: string } | { id: string }[] };
    pictures?: { data?: { id: string }[] };
  };
}

interface RescueGroupsIncluded {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
}

interface RescueGroupsResponse {
  data: RescueGroupsAnimal[];
  included?: RescueGroupsIncluded[];
}

function mapSize(sizeGroup: string | undefined): 'small' | 'medium' | 'large' | null {
  if (!sizeGroup) return null;
  const normalized = sizeGroup.toLowerCase();
  if (normalized.includes('small')) return 'small';
  if (normalized.includes('large') || normalized.includes('x-large')) return 'large';
  if (normalized.includes('medium')) return 'medium';
  return null;
}

function mapAgeYears(ageGroup: string | undefined): number | null {
  if (!ageGroup) return null;
  const normalized = ageGroup.toLowerCase();
  if (normalized.includes('baby')) return 0.5;
  if (normalized.includes('young')) return 2;
  if (normalized.includes('adult')) return 5;
  if (normalized.includes('senior')) return 9;
  return null;
}

function findOrgName(
  animal: RescueGroupsAnimal,
  included: RescueGroupsIncluded[]
): string | null {
  const orgRel = animal.relationships?.orgs?.data;
  const orgId = Array.isArray(orgRel) ? orgRel[0]?.id : orgRel?.id;
  if (!orgId) return null;
  const org = included.find((item) => item.type === 'orgs' && item.id === orgId);
  return (org?.attributes.name as string | undefined) ?? null;
}

async function syncSpecies(
  apiKey: string,
  supabase: SupabaseClient,
  rescueGroupsPlural: string,
  ourSpecies: OurSpecies
): Promise<{ synced: number; error: string | null }> {
  const rgResponse = await fetch(
    `${RESCUEGROUPS_BASE_URL}${rescueGroupsPlural}/?limit=100&include=orgs,pictures`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Authorization: apiKey,
      },
      body: JSON.stringify({
        filters: [
          { fieldName: 'species.plural', operation: 'equal', criteria: rescueGroupsPlural },
          { fieldName: 'statuses.name', operation: 'equal', criteria: 'Available' },
        ],
      }),
    }
  );

  if (!rgResponse.ok) {
    const body = await rgResponse.text();
    return { synced: 0, error: `RescueGroups API error ${rgResponse.status}: ${body}` };
  }

  const rgData: RescueGroupsResponse = await rgResponse.json();
  const included = rgData.included ?? [];

  const rows = rgData.data.map((animal) => ({
    name: animal.attributes.name ?? 'Unknown',
    species: ourSpecies,
    breed: animal.attributes.breedPrimary ?? null,
    age_years: mapAgeYears(animal.attributes.ageGroup),
    size: mapSize(animal.attributes.sizeGroup),
    photos: animal.attributes.pictureThumbnailUrl ? [animal.attributes.pictureThumbnailUrl] : [],
    description: animal.attributes.descriptionText ?? null,
    source_provider: 'rescuegroups',
    source_listing_id: animal.id,
    status: 'available' as const,
    shelter_name: findOrgName(animal, included),
  }));

  if (rows.length === 0) {
    return { synced: 0, error: null };
  }

  const { error } = await supabase
    .from('animals')
    .upsert(rows, { onConflict: 'source_provider,source_listing_id' });

  if (error) {
    return { synced: 0, error: error.message };
  }
  return { synced: rows.length, error: null };
}

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get('RESCUEGROUPS_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'RESCUEGROUPS_API_KEY is not set' }), {
        status: 500,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const results: Record<string, { synced: number; error: string | null }> = {};
    for (const { rescueGroupsPlural, ourSpecies } of SPECIES_TO_SYNC) {
      results[ourSpecies] = await syncSpecies(apiKey, supabase, rescueGroupsPlural, ourSpecies);
    }

    const anyError = Object.values(results).find((r) => r.error);
    return new Response(JSON.stringify({ results }), { status: anyError ? 502 : 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
