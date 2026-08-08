# Pawswipe — Build Progress & Handoff

Read this first in any new session before touching code. It's the "where did we leave off"
doc — `docs/PLAN.md` is the spec, this is the status.

## Where things stand

Phases 1–6 are complete, tested in-browser, and committed/pushed. Phase 7 (sharing) is code-complete
and about to be committed, but **one step is unverified**:

- Migration `supabase/migrations/0012_referral_trigger.sql` was written to fix a real bug (referrals
  couldn't be inserted client-side because email confirmation means there's no authenticated session
  yet when `signUp()` resolves, so RLS blocked the insert — fixed by writing the referral via signup
  metadata + a database trigger instead). The user was about to run it in the SQL Editor and hit
  Supabase's "destructive operation" warning (expected — it touches the `auth` schema; the statement
  itself is safe, it only adds a trigger, doesn't alter `auth.users`). **Confirm this migration
  actually ran, then re-verify the referral flow** before considering Phase 7 done.

### How to re-verify the referral flow
1. Get a real animal id: `select id from animals limit 1;`
2. Sign out of any test account in the app.
3. In the browser console (web target): `localStorage.setItem('pawswipe.pendingSharedAnimal', JSON.stringify({animalId: '<id>', ref: '<some-existing-user-id>'}))`
4. Sign up a brand-new test email (e.g. `pawswipe.test+referral2@gmail.com` / `TestPassword123!`).
5. Verify with:
   ```sql
   select r.animal_id, r.referrer_user_id, a.name as animal_name, u.email as new_user_email
   from referrals r
   join auth.users u on u.id = r.referred_user_id
   left join animals a on a.id = r.animal_id
   where u.email = 'pawswipe.test+referral2@gmail.com';
   ```
   Should return one row. If it doesn't, the trigger migration didn't apply — re-run it.

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

## Infrastructure reference
- Supabase project ref: `acetieuvjywddymjoxgq` (URL/anon key in `.env`, gitignored)
- Edge Functions deployed (via Supabase dashboard, not CLI — no `supabase login` in this environment):
  - `sync-animals` — pulls RescueGroups listings (dogs + cats confirmed; "other" species not wired to
    a real provider query yet). Scheduled every 4h via Cron job `sync-animals-schedule` (pg_cron +
    pg_net, confirmed active).
  - `submit-application` — sends the one-tap Apply email via Resend. Runs as the calling user (RLS-
    scoped), not service role.
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
1. Finish verifying Phase 7 (referral flow above), commit any fixes.
2. Phase 8: Polish, error handling, edge cases (the Rough Day / Edge Case flows in plan section 5 —
   most sad-paths are already handled per-feature as they were built, but worth a dedicated pass).
3. Phase 9: Pre-launch prep — legal pages, security pass, the three audits in plan section 17, and
   the Resend domain gap above.
4. Phase 10: Deployment (App Store / Play Store, waitlist invite from plan section 14).

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
