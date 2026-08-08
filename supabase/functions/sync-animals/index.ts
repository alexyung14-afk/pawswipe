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
const MAX_PHOTOS_PER_ANIMAL = 6;

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
    ageString?: string;
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

// Bucket fallback for when ageString isn't present/parseable.
function mapAgeGroupYears(ageGroup: string | undefined): number | null {
  if (!ageGroup) return null;
  const normalized = ageGroup.toLowerCase();
  if (normalized.includes('baby')) return 0.5;
  if (normalized.includes('young')) return 2;
  if (normalized.includes('adult')) return 5;
  if (normalized.includes('senior')) return 9;
  return null;
}

// RescueGroups' ageString looks like "11 Years 7 Months" or "6 Months" -- this is the real
// age, far more precise than the ageGroup bucket (Baby/Young/Adult/Senior).
function parseAgeYears(ageString: string | undefined, ageGroup: string | undefined): number | null {
  if (ageString) {
    const yearsMatch = ageString.match(/(\d+)\s*Year/i);
    const monthsMatch = ageString.match(/(\d+)\s*Month/i);
    if (yearsMatch || monthsMatch) {
      const years = yearsMatch ? parseInt(yearsMatch[1], 10) : 0;
      const months = monthsMatch ? parseInt(monthsMatch[1], 10) : 0;
      return Math.round((years + months / 12) * 10) / 10;
    }
  }
  return mapAgeGroupYears(ageGroup);
}

// RescueGroups descriptions come through with HTML entities un-decoded (&rsquo;, &nbsp;, etc.)
// even in the "text" field, so they'd render as literal text in the app without this.
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  mdash: '—',
  ndash: '–',
  hellip: '…',
};

function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity[0] === '#') {
      const code =
        entity[1] === 'x' || entity[1] === 'X'
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[entity] ?? match;
  });
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

// Prefers the "large" (500px) rendition over the 100px thumbnail, ordered the way the
// shelter ordered them, capped so the swipe card gallery doesn't have to page through
// dozens of photos.
function findPhotoUrls(animal: RescueGroupsAnimal, included: RescueGroupsIncluded[]): string[] {
  const pictureRel = animal.relationships?.pictures?.data ?? [];
  const ids = new Set(pictureRel.map((p) => p.id));
  if (ids.size === 0 && animal.attributes.pictureThumbnailUrl) {
    return [animal.attributes.pictureThumbnailUrl];
  }

  const pictures = included
    .filter((item) => item.type === 'pictures' && ids.has(item.id))
    .sort((a, b) => {
      const orderA = (a.attributes.order as number | undefined) ?? 0;
      const orderB = (b.attributes.order as number | undefined) ?? 0;
      return orderA - orderB;
    });

  const urls = pictures
    .map((p) => {
      const attrs = p.attributes as { large?: { url?: string }; small?: { url?: string } };
      return attrs.large?.url ?? attrs.small?.url;
    })
    .filter((url): url is string => Boolean(url));

  return urls.length > 0
    ? urls.slice(0, MAX_PHOTOS_PER_ANIMAL)
    : animal.attributes.pictureThumbnailUrl
      ? [animal.attributes.pictureThumbnailUrl]
      : [];
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
    age_years: parseAgeYears(animal.attributes.ageString, animal.attributes.ageGroup),
    size: mapSize(animal.attributes.sizeGroup),
    photos: findPhotoUrls(animal, included),
    description: animal.attributes.descriptionText
      ? decodeHtmlEntities(animal.attributes.descriptionText)
      : null,
    source_provider: 'rescuegroups',
    source_listing_id: animal.id,
    status: 'available' as const,
    shelter_name: findOrgName(animal, included),
  }));

  if (rows.length === 0) {
    // Treated as a no-op rather than "everyone's adopted" -- an empty result is more likely
    // a transient provider hiccup than every dog/cat of a species genuinely running out, and
    // marking the whole species adopted on that guess would be worse than doing nothing.
    return { synced: 0, error: null };
  }

  const { error } = await supabase
    .from('animals')
    .upsert(rows, { onConflict: 'source_provider,source_listing_id' });

  if (error) {
    return { synced: 0, error: error.message };
  }

  // Anything we'd previously synced for this species that's no longer in the provider's
  // available results has been adopted, pulled, or otherwise removed (PLAN.md edge case:
  // "dog gets adopted by someone else mid-flow"). Only rows still marked 'available' are
  // touched, so this never overwrites an already-'pending'/'adopted' row with stale info.
  const stillAvailableIds = rgData.data.map((animal) => `"${animal.id}"`).join(',');
  const { error: staleError } = await supabase
    .from('animals')
    .update({ status: 'adopted' })
    .eq('source_provider', 'rescuegroups')
    .eq('species', ourSpecies)
    .eq('status', 'available')
    .not('source_listing_id', 'in', `(${stillAvailableIds})`);

  if (staleError) {
    return { synced: rows.length, error: `Synced but failed to mark stale listings: ${staleError.message}` };
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
