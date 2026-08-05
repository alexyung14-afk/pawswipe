@AGENTS.md
@docs/HOUSE-RULES.md

# Pawswipe

Swipe to like dogs, cats, or other pets ("Find pets" tab, filterable by species), one-tap apply
to shelters using a saved adopter profile. Full plan: `docs/PLAN.md`.

## Folder map
- `src/features/swiping` — card stack, filters (including species), likes ("Find pets" + "Likes" tabs)
- `src/features/profile` — the adopter profile (housing, experience, household, references)
- `src/features/applications` — one-tap Apply + application status tracking
- `src/shared/data` — `AnimalRepository` (RescueGroups.org provider for dogs/cats now; ShelterLuv planned as a V2 per-shelter pilot)
- `src/shared/db` — database client and queries
- `src/shared/auth` — sign-in and session
- `src/shared/components` — UI shared across features
