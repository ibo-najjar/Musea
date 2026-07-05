# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Project: Musea

A visual bookmarking app (like a visual Pinterest/Pocket) where users save web content (URLs, images, text) that gets AI-enriched and organized into galleries.

### Commands

```bash
# Start dev server
npx expo start

# Start for specific platform
npx expo start --ios
npx expo start --android

# Lint (uses Biome, not ESLint)
npx biome check .
npx biome check --write .   # auto-fix

# Start Convex backend (separate terminal)
npx convex dev
```

**No test suite is configured.** Biome is the only static checker (`@biomejs/biome` in devDependencies).

### Environment Variables

- `EXPO_PUBLIC_CONVEX_URL` — Convex deployment URL (client-side)
- `EXPO_PUBLIC_CONVEX_SITE_URL` — Convex HTTP actions URL, used as Better Auth `baseURL`
- `OPENAI_API_KEY` — Set in Convex dashboard for server-side AI enrichment

### Architecture

**Frontend** (`src/app/`) uses Expo Router file-based routing:
- `_layout.tsx` — Root: wraps everything in `ConvexBetterAuthProvider`, `HeroUINativeProvider`, `ShareIntentProvider`, `GestureHandlerRootView`, `KeyboardProvider`
- `(auth)/` — Login screen, shown when unauthenticated (`Stack.Protected guard={!session}`)
- `(app)/` — Main app, shown when authenticated (`Stack.Protected guard={!!session}`)
  - `(tabs)/` — 4 tabs: Home (`index`), Galleries, Settings, Add (the Add tab is `disabled` and its native tab press is intercepted via `NativeTabs` `onTabSelectionPrevented` in `src/components/app-tabs.tsx`, opening a modal instead)
  - `(modal)/` — Sheet presentations for artifact details, gallery creation/editing, share handling

**Backend** (`convex/`) is a Convex deployment:
- `schema.ts` — Three tables: `artificats` (note the typo — preserved intentionally), `gallery`, `galleryArtifacts`
- `artifacts.ts` — CRUD for saved items; `createArtifact` schedules AI enrichment immediately for URL-based items
- `ai.ts` — `enrichArtifact` internal action: uses `gpt-4o-mini` to extract title/summary/tags/topic, embeds with `text-embedding-3-small` (1536 dims), auto-creates a gallery by topic
- `search.ts` — Vector search over artifact embeddings
- `auth.ts` / `auth.config.ts` — Better Auth integration via `@convex-dev/better-auth`

**Styling** uses two systems:
- `heroui-native` — Primary system. Use `useThemeColor("accent")` etc. for theme-aware colors. CSS variables defined in `src/global.css`.
- Tailwind v4 + Uniwind (`className` props) — For layout and utility classes.
- `src/constants/theme.ts` has a legacy `Colors`/`useTheme` hook — prefer `heroui-native`'s `useThemeColor` for new code.

**Auth** flows through `src/lib/auth-client.ts` — `createAuthClient` from `better-auth/react` with the `expoClient` and `convexClient` plugins. Session is accessed via `authClient.useSession()` in the root layout to gate routes.

**Known typo:** The Convex table is named `artificats` (missing 'f'). Don't correct it — changing the table name requires a migration.
