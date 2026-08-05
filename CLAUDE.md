@AGENTS.md
@docs/HOUSE-RULES.md

# Pawswipe

Swipe to shortlist dogs, one-tap apply to shelters using a saved adopter profile.
Full plan: `docs/PLAN.md`.

## Folder map
- `src/features/swiping` — card stack, filters, shortlist
- `src/features/profile` — the adopter profile (housing, experience, household, references)
- `src/features/applications` — one-tap Apply + application status tracking
- `src/shared/data` — `DogRepository` (Petfinder/RescueGroups/ShelterLuv providers)
- `src/shared/db` — database client and queries
- `src/shared/auth` — sign-in and session
- `src/shared/components` — UI shared across features
