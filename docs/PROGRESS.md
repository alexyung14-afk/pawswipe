# Pawswipe — Build Progress & Handoff

Read this first in any new session before touching code. It's the "where did we leave off"
doc — `docs/PLAN.md` is the spec, this is the status.

## Where things stand

Phases 1–6 are complete, tested in-browser, and committed/pushed. Phase 7 (sharing) is fully
verified and code-complete. Phase 8 (polish, error handling, edge cases — PLAN.md section 5's
Rough Day Flow and Edge Cases) is in progress, going one item at a time, each verified in-browser
before moving to the next:

- **Done: account deletion (edge case E).** New `supabase/functions/delete-account/index.ts`
  Edge Function (service-role, verifies the caller's own JWT first, calls
  `auth.admin.deleteUser`) plus a "Delete Account" section in `ProfileScreen.tsx` with an inline
  two-step confirm (not `Alert.alert` — react-native-web's Alert doesn't reliably render custom
  buttons, same class of issue as the Share API note below). `adopter_profiles`, `likes`, and
  `applications` all cascade-delete via their `auth.users(id) on delete cascade` foreign keys, so
  no separate cleanup code was needed. Verified end-to-end with a disposable test account: deleted
  via the real UI flow, confirmed zero rows left in `auth.users`/`applications`/`likes` after.
- **Done: dog adopted mid-flow (edge case A).** `sync-animals/index.ts` now marks any
  previously-`available` animal that drops out of the provider's current "available" results as
  `adopted` (skipped entirely if a species sync returns zero rows, to avoid mass-marking on what's
  more likely a transient provider hiccup than everyone-got-adopted). `AnimalDetailScreen.tsx`
  re-fetches the live row on open instead of trusting the possibly-stale prop, and if the animal's
  status isn't `available` it shows a "No longer available" message plus up to 4 similar
  same-species animals (new `fetchSimilarAnimals` in `AnimalRepository.ts`), tappable via a new
  `onSelectAnimal` prop wired from both `SwipeDeckScreen` and `LikesScreen`.
  Found and fixed a real bug during verification: `AnimalDetailScreen` doesn't remount when
  `onSelectAnimal` swaps in a different animal (same component instance, new props), so
  `unavailable`/`similarAnimals`/`application`/`applyError` state leaked across animals — viewing
  an available animal right after an unavailable one incorrectly showed "no longer available" too.
  Fixed by resetting that state at the top of the load effect. Verified end-to-end: marked a real
  listing adopted, confirmed the swipe deck excludes it and the detail screen shows the
  unavailable state with real similar-species suggestions, then confirmed tapping through to an
  available suggestion shows the normal Apply flow (this is what caught the state-leak bug).
- Remaining, in order: duplicate-application warning (B), cached listings on load failure (Rough
  Day 1), Apply auto-retry (Rough Day 2). Deferred: returning after 3 months (C, lowest-confidence
  item, revisit later). Provider fallback (D) is N/A until ShelterLuv (V2) exists.

Phase 7 (sharing) verification notes, kept for reference:

- Migration `supabase/migrations/0012_referral_trigger.sql` (referrals couldn't be inserted
  client-side because email confirmation means there's no authenticated session yet when `signUp()`
  resolves, so RLS blocked the insert — fixed by writing the referral via signup metadata + a
  database trigger instead) is confirmed applied (`handle_new_user_referral` function and
  `on_auth_user_created_referral` trigger both exist on `auth.users`).
- Found and fixed a real bug in `src/features/swiping/useIncomingAnimalLink.ts`: `parseAnimalLink`
  joined `[hostname, path]` before matching against `^animal\/...`, which only works for native
  custom-scheme links (`pawswipe://animal/123`, where expo-linking puts `animal` in `hostname`). On
  web, `hostname` is the real domain (`localhost`, etc.), so the joined string became
  `localhost/animal/123` and never matched — shared links silently did nothing on the web target.
  Fixed by trying `parsed.path` alone first, falling back to the hostname+path join for native links.
- End-to-end verified: real deep link (`http://localhost:8081/animal/<id>?ref=<referrerId>`) → signup
  → referral row written with the correct `animal_id` and `referrer_user_id`. Confirmed with a fresh
  animal id per attempt to rule out stale cached data (an early verification attempt was a false
  positive from AsyncStorage's web layer caching stale data from a prior real session, not from the
  raw `localStorage.setItem` used to seed the test — that method doesn't reach the app's in-memory
  AsyncStorage cache on web, so future manual tests should navigate to the real deep-link URL instead).

## Known pre-launch gap (important — belongs in Phase 9)

The one-tap Apply email (`supabase/functions/submit-application/index.ts`) sends from Resend's shared
sandbox address `onboarding@resend.dev`. **This has only been verified sending to the Resend account
owner's own email** (alexyung14@gmail.com, used as a test "shelter" address). Resend's sandbox mode
typically restricts sending to arbitrary third-party addresses until a custom sending domain is
verified in the Resend dashboard. Real shelter emails will very likely fail until that's done. Fix:
verify a domain in Resend, update `FROM_ADDRESS` in that Edge Function.

## Test accounts
- `pawswipe.test+phase3@gmail.com` / `TestPassword123!` — confirmed. Has a filled-out profile, has
  liked/applied to several animals (mix of seed-test and real RescueGroups data).
- `pawswipe.test+referral1@gmail.com` / `TestPassword123!` — created to test referrals before the
  trigger fix, never confirmed via email. Harmless to leave or delete.
- `pawswipe.test+referral2@gmail.com` / `TestPassword123!` — used to verify the Phase 7 referral
  trigger. Still exists, unconfirmed beyond that one signup.
- `pawswipe.test+referral3@gmail.com` — used to verify both the Phase 7 deep-link fix and the
  Phase 8 account-deletion flow, then deleted via the real Delete Account UI as part of that
  verification. **No longer exists** — confirmed zero rows in `auth.users`/`applications`/`likes`.

## Infrastructure reference
- Supabase project ref: `acetieuvjywddymjoxgq` (URL/anon key in `.env`, gitignored)
- Edge Functions deployed (via Supabase dashboard, not CLI — no `supabase login` in this environment):
  - `sync-animals` — pulls RescueGroups listings (dogs + cats confirmed; "other" species not wired to
    a real provider query yet). Scheduled every 4h via Cron job `sync-animals-schedule` (pg_cron +
    pg_net, confirmed active).
  - `submit-application` — sends the one-tap Apply email via Resend. Runs as the calling user (RLS-
    scoped), not service role.
  - `delete-account` — verifies the caller's own JWT, then uses the service role to call
    `auth.admin.deleteUser`. Cascading FKs handle cleanup of dependent rows.
- Secrets set (Supabase dashboard → Edge Functions → Manage secrets): `RESCUEGROUPS_API_KEY`,
  `RESEND_API_KEY`
- External accounts live: RescueGroups.org (key active, self-serve approved), Resend (free tier,
  sandbox sender — see gap above)
- GitHub: https://github.com/alexyung14-afk/pawswipe

## Data notes
- The `animals` table mixes real RescueGroups data (`source_provider = 'rescuegroups'`) with seed
  test data (`source_provider = 'seed-test'`, includes intentionally-broken-ish fixtures: a no-photo
  animal, a no-description animal, a very-long-description animal). Safe to clear seed data once no
  longer needed: `delete from animals where source_provider = 'seed-test';`

## What's next (per docs/PLAN.md section 19)
1. Phase 8, continued: duplicate-application warning (B) next, then cached listings on load
   failure (Rough Day 1), Apply auto-retry (Rough Day 2). See "Where things stand" above for
   what's already done and why C/D aren't in this pass.
2. Phase 9: Pre-launch prep — legal pages, security pass, the three audits in plan section 17, and
   the Resend domain gap above. Also worth revisiting: Supabase's built-in auth mailer is capped at
   2 emails/hour and can't be raised without custom SMTP — likely needs a custom SMTP provider (could
   reuse the existing Resend account) before real signups at any volume.
3. Phase 10: Deployment (App Store / Play Store, waitlist invite from plan section 14).

## Working notes for whoever continues this
- The user runs all Supabase dashboard / SQL Editor / secret-setting steps themselves — paste exact
  SQL or function code as a block for them to copy. Don't assume dashboard labels are exactly as
  remembered; Supabase's UI has already shifted mid-project once (API Keys page moved).
- Test in-browser via the Expo web dev server (`npm run web`) before considering anything done. This
  project has caught several real bugs this way that a code read wouldn't have: Edge Function CORS
  missing headers, `useNativeDriver: true` silently dropping its completion callback on web, and
  React Native Web's `Share` API needing a clipboard fallback.
- Git identity is configured locally in this repo only (Alex Yung / alexyung14@gmail.com), not set
  globally on this machine.
- House rules (naming consistency, sad-path handling, etc.) are in `docs/HOUSE-RULES.md` and already
  wired into `CLAUDE.md` — no need to repeat them here.
