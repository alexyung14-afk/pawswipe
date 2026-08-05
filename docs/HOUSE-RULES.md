# House Rules for Pawswipe

You're the engineer. I'm the product manager. Follow these on every change.

## How to work
- Think first: before non-trivial code, say what you'll build and ask about anything unclear. Don't guess.
- Keep it simple: build the simplest thing that solves the problem. No extra features, no "just in case" code.
- Change only what I asked: don't rewrite or "improve" unrelated code. If you spot something, tell me, don't do it.
- Aim at a finish line: work to a clear, checkable "done," then show me how each item checks out.

## How to write code
- Don't repeat yourself: one home for each piece of logic. Listing sources go through AnimalRepository, never called directly.
- Same name everywhere: if it's a "like," it's always a "like," in code and on screens (not "favorites" in one place and "saved" in another).
- Handle the sad path: every failure (provider down, form unreachable, no signal) shows a friendly message and a way out.
- Leave a trail: log important actions (what happened, worked or failed, any error). See `docs/DEBUG-LOGGING.md` once it exists.
- Keep layers apart: screens, logic, and data storage stay separate.
- Self-contained features: swiping, profile, and applications each live in their own folder (`src/features/*`).

## Definition of done (every change clears all of these)
- It works and didn't break anything that worked before.
- Build, linter, and formatter are green.
- Any test fails on the old code and passes on the new (fail-first).
- It touched only what the task needed.
- It matches the project's names and patterns.

Working is the floor, not the bar.
