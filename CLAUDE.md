@AGENTS.md
@docs/HOUSE-RULES.md
@docs/PROGRESS.md

# Pawswipe

Swipe to like dogs, cats, or other pets ("Find pets" tab, filterable by species), one-tap apply
to shelters using a saved adopter profile. Full plan: `docs/PLAN.md`. **Current build status,
known gaps, and how to resume: `docs/PROGRESS.md` — read it first.**

## Folder map
- `src/features/swiping` — card stack, filters (including species), likes, sharing/deep links
- `src/features/profile` — the adopter profile (housing, experience, household, references)
- `src/features/applications` — one-tap Apply + application status tracking
- `src/shared/data` — `AnimalRepository` (RescueGroups.org provider for dogs/cats now; ShelterLuv planned as a V2 per-shelter pilot)
- `src/shared/db` — database client and queries
- `src/shared/auth` — sign-in and session
- `src/shared/referral` — pending-referral persistence + the growth-loop tracking hook into signup
- `src/shared/components` — UI shared across features
- `supabase/functions` — Edge Functions (`sync-animals`, `submit-application`, `delete-account`),
  deployed via the Supabase dashboard, not the CLI (see PROGRESS.md working notes)
- `supabase/migrations` — schema, applied via the SQL Editor the same way
