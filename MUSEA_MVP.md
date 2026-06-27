# Musea — Production Readiness Plan

Visual bookmarking app — save anything, find it instantly. Items are **artifacts**, collections are **galleries**.

Target: **iOS App Store public launch** · Timeline: **2 weeks** · Scale: **1k+ users**

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Expo 56, React Native 0.85 |
| Navigation | Expo Router (file-based) |
| Backend | Convex |
| Auth | Better Auth + Google & Apple OAuth |
| AI | Vercel AI SDK (`ai`, `@ai-sdk/openai`) · gpt-4o-mini + text-embedding-3-small |
| Styling | NativeWind + Uniwind + heroui-native |
| Glass UI | expo-glass-effect |
| Lists | FlashList (masonry) |

---

## Current State

### ✅ Built & Working

| Feature | Notes |
|---|---|
| Auth (Apple + Google) | Animated onboarding carousel, Better Auth + Convex |
| Save URL | Server-side OG preview, AI enrichment pipeline, auto-gallery assignment |
| Save Text | Size/weight styling, card preview |
| View Artifacts | Masonry grid, image zoom, inline video, embed player, text cards |
| Vector Search | 1536-dim embeddings, 600ms debounce, real-time results |
| Create Gallery | Zod validation, react-hook-form |
| Gallery List | 2-column grid with live cover previews |
| Gallery Detail | Masonry artifacts, add-from-suggestions flow |
| Manage Artifact Galleries | Multi-select, delta state tracking, batch save |
| Suggested Artifacts | Selectable masonry grid with footer CTA |
| Artifact Details | Title, tags, description (AI-generated) |
| Share Intent | OS share → Add modal auto-fill |
| User Profile | Avatar upload (Convex file storage), display name editing |
| Source Icons | Branded SVG icons for 20+ domains |
| Empty States | No results, nothing saved, not found |

### ⚠️ Incomplete (UI exists, not wired)

| Feature | Issue |
|---|---|
| Gallery edit | `edit-gallery/[galleryId].tsx` reads from `dummy-data.ts` — no `updateGallery` mutation |
| Gallery delete | Toolbar action exists, `onPress` is empty |
| Artifact delete | Menu action exists, `onPress` is empty |
| Create-gallery validation | Error message shows placeholder "Heyyyy" instead of real Zod error |
| Auto-gallery badge | No visual distinction between AI auto-galleries and user-created galleries |

### ❌ Broken / Security Gaps

| Issue | Location | Severity |
|---|---|---|
| `listArtifacts` returns all users' data | `convex/artifacts.ts` | Critical |
| `listGalleries` returns all users' data | `convex/galleries.ts` | Critical |
| `addArtifactToGallery` uses hardcoded `userId: "anonymous"` | `convex/galleryArtifacts.ts` | Critical |
| `patchArtifact` / `deleteArtifact` have no ownership check | `convex/artifacts.ts` | Critical |
| `patchArtifact` exposes `status` and `embedding` to clients | `convex/artifacts.ts` | High |
| `listArtifacts` references non-existent `by_creation_time` index | `convex/artifacts.ts` | Bug |
| All list queries use `.collect()` — full table scans | Multiple files | High |
| No rate limiting on AI enrichment | `convex/ai.ts` | High |
| No error boundaries or success/failure toasts | Frontend | Medium |

---

## 2-Week Sprint

### Week 1 — Backend & Security (Days 1–7)

#### Day 1–2 · Security fixes
**Files:** `convex/artifacts.ts`, `convex/galleries.ts`, `convex/galleryArtifacts.ts`

- [ ] Add `ctx.auth.getUserIdentity()` guard to `listArtifacts`, `patchArtifact`, `deleteArtifact`; filter results by `identity.subject`
- [ ] Remove public `listGalleries`; route all callers to `listUserGalleries` (already auth-gated)
- [ ] Fix `addArtifactToGallery` and `addArtifactsToGallery` to use real `userId` from `ctx.auth`
- [ ] Restrict `patchArtifact` validator — exclude `status`, `embedding`, `userId` from client-writable fields

*Pattern to reuse:* `const identity = await ctx.auth.getUserIdentity(); if (!identity) throw new ConvexError("Unauthenticated");` — already in `createArtifact`, `createGallery`

#### Day 2 · Fix index bug
**File:** `convex/schema.ts`

- [ ] Add `.index("by_creation_time", ["userId", "_creationTime"])` to `artificats` table
  - Unblocks `listArtifacts` sort order without a full-table scan

#### Day 3–4 · Pagination
**Files:** `convex/artifacts.ts`, `convex/galleries.ts`, `convex/galleryArtifacts.ts`

- [ ] `listArtifacts`: replace `.collect()` with `paginationOptsValidator` cursor pagination, page size 50
- [ ] `listArtifactsInGallery`: same cursor pagination, page size 50
- [ ] `listUserGalleries`: `.take(100)` is sufficient (galleries grow slower)
- [ ] `countArtifactsInGallery`: replace `.collect()` + `.length` with `.take(1000)` + `.length` or a dedicated count query

*`paginationOptsValidator` is already available from `convex/server` (already a dep).*

#### Day 5–6 · Rate limiting on AI enrichment
**Files:** `convex/ai.ts`, `convex/artifacts.ts`

- [ ] Before scheduling `enrichArtifact`, check a per-user daily quota (store in a `rateLimits` table or use `convex-helpers` rate limiter)
- [ ] On quota exceeded: save artifact as `status: "ready"` with the raw title, skip enrichment silently

#### Day 7 · Duplicate detection
**Files:** `convex/artifacts.ts` (new query), `src/app/(app)/(modal)/add.tsx`

- [ ] New query `findArtifactByUrl({ sourceUrl })` — filters `by_user` index for matching `source` field
- [ ] In `add.tsx`: debounced check (reuse existing 500ms debounce pattern) after URL entry
- [ ] If duplicate found: show inline warning card with "View existing" link and "Save anyway" option

---

### Week 2 — Feature Completion & Polish (Days 8–14)

#### Day 8–10 · Complete stubbed features
**Files:** `convex/galleries.ts`, `src/app/(app)/(modal)/edit-gallery/[galleryId].tsx`, `src/app/(app)/(tabs)/(galleries)/gallery/[galleryId].tsx`, `src/app/(app)/(modal)/artifact/[artifactId].tsx`

- [ ] Add `updateGallery` mutation to `convex/galleries.ts` (name, description)
- [ ] Wire `edit-gallery/[galleryId].tsx` to `updateGallery`; delete dependency on `src/constants/dummy-data.ts`
- [ ] Add `deleteGallery` mutation to `convex/galleries.ts` (cascade delete `galleryArtifacts` join rows)
- [ ] Wire gallery detail toolbar delete action to `deleteGallery` with confirmation alert
- [ ] Wire artifact detail delete menu item to existing `deleteArtifact` mutation with confirmation alert
- [ ] Fix create-gallery form: replace "Heyyyy" placeholder with real `FieldError` message from Zod

#### Day 10 · Auto-gallery visual badge
**Files:** `src/components/gallery-card.tsx`, `src/app/(app)/(tabs)/(galleries)/gallery/[galleryId].tsx`

- [ ] `GalleryCard`: when `gallery.isAuto === true`, overlay a small sparkle (✦ or SF Symbol `sparkles`) badge on the card
- [ ] Gallery detail header: add "Auto-generated" subtitle line when `isAuto === true`

#### Day 11–12 · Error handling & feedback
**Files:** `src/app/_layout.tsx`, new `src/lib/toast.ts`, affected modals

- [ ] Add `react-native-toast-message` (or lightweight Reanimated-based toast) — mount in root `_layout.tsx`
- [ ] Add success toasts: save artifact, create gallery, delete artifact, delete gallery, update profile
- [ ] Add error toasts for caught mutation failures
- [ ] Wrap root `_layout.tsx` body in an error boundary (`react-error-boundary`)
- [ ] Add in-flight loading state to delete buttons so they can't be double-tapped

#### Day 13–14 · App Store prep
**Files:** `app.json`, `app.config.ts`, `eas.json`, `PrivacyInfo.xcprivacy`

- [ ] Verify bundle ID, version (`1.0.0`), build number, display name in `app.json`
- [ ] Audit permissions strings (camera, photo library, network) — must have human-readable purpose strings
- [ ] Add `PrivacyInfo.xcprivacy` — declare API reasons for: UserDefaults (`NSPrivacyAccessedAPICategoryUserDefaults`), file timestamps, system boot time (required by iOS 17+)
- [ ] Verify `eas.json` production profile has `"distribution": "store"` and correct Apple credentials
- [ ] Prepare App Store Connect: description, keywords (max 100 chars), support URL, age rating (4+), privacy policy URL
- [ ] Create 6.7" (iPhone 16 Pro Max) and 6.1" (iPhone 16) screenshots — minimum 3 each
- [ ] Submit internal TestFlight build; invite ≥2 testers; address any crash reports before public submission

---

## New Features (add in Week 2)

### Duplicate Detection
When a user pastes a URL in the Add modal, check if they've already saved it.

```
Query: findArtifactByUrl({ sourceUrl: string })
  → query artificats by_user index
  → filter where doc.source === sourceUrl
  → return first match or null

UI (add.tsx):
  → after URL debounce resolves, call findArtifactByUrl
  → if match: show warning card "Already saved · [thumbnail]"
     with "View" (navigate to artifact modal) + "Save anyway" (dismiss warning, proceed)
```

### Auto-Gallery Badge
Distinguish AI-generated galleries from user-created ones.

```
GalleryCard:
  → if gallery.isAuto === true
  → render sparkle badge (SF Symbol "sparkles" or ✦ text) 
     absolute top-right, 20px, accent color

Gallery detail header:
  → if gallery.isAuto: subtitle = "Auto-generated by AI"
  → else: subtitle = null (no change)
```

---

## Env Vars Required

```bash
# Convex dashboard (npx convex env set KEY value)
OPENAI_API_KEY=sk-...

# Better Auth (Google OAuth)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Better Auth (Apple OAuth)
APPLE_CLIENT_ID=...
APPLE_CLIENT_SECRET=...
APPLE_BUNDLE_ID=...

# Expo (client-side, in .env)
EXPO_PUBLIC_CONVEX_URL=https://...convex.cloud
EXPO_PUBLIC_CONVEX_SITE_URL=https://...convex.site
```

---

## Key Architecture Decisions

- **AI SDK**: Vercel AI SDK with `@ai-sdk/openai` for structured generation (`generateObject`) and embeddings
- **Embeddings**: `text-embedding-3-small` (1536 dims) stored in Convex vector index filtered by `userId`
- **Blocked image hosts**: Instagram, Facebook, TikTok, Twitter CDNs blocked in `ai.ts` to avoid hotlink failures
- **X/Twitter video**: `twitter:player:image` checked first in `preview.ts`; profile picture URLs discarded
- **FlashList recycling fix**: Cards with no image render a plain `View` placeholder (not `<Image uri={undefined}>`)
- **Known typo**: DB table is named `artificats` (missing 'f'). Preserved intentionally — changing requires a migration.
- **Auth pattern**: `const identity = await ctx.auth.getUserIdentity(); if (!identity) throw new ConvexError("Unauthenticated");`

---

## Verification Checklist

- [ ] **Security**: Authenticated as user B, cannot read user A's artifacts or galleries via direct API call
- [ ] **Index bug**: `listArtifacts` runs without error; home screen loads
- [ ] **Pagination**: With 100+ artifacts, home screen loads first 50 and scrolling fetches more
- [ ] **Gallery edit**: Edit gallery name → reopen gallery → name persists
- [ ] **Gallery delete**: Delete gallery → gone from list; its `galleryArtifacts` rows also gone
- [ ] **Artifact delete**: Delete artifact → gone from home grid and from all galleries
- [ ] **Duplicate detection**: Save URL → try saving same URL → warning appears
- [ ] **Auto-gallery badge**: Save URL → AI enrichment runs → resulting auto-gallery shows sparkle badge
- [ ] **Toasts**: Save artifact, create gallery, delete both → success toast appears each time
- [ ] **Biome**: `npx biome check .` exits 0
- [ ] **EAS build**: `eas build --platform ios --profile production` completes without errors
- [ ] **TestFlight**: Build installs and runs on a physical iPhone without crashes

---

## Screens (all routes)

| Route | Screen | Status |
|---|---|---|
| `/(auth)/` | Login with Apple / Google | ✅ |
| `/(tabs)/` | Home — masonry grid + vector search | ✅ |
| `/(tabs)/add` | Add tab (intercepted → modal) | ✅ |
| `/(tabs)/(galleries)/` | Galleries list | ✅ |
| `/(tabs)/(galleries)/gallery/[galleryId]` | Gallery detail | ✅ |
| `/(tabs)/(settings)/` | Settings / profile | ✅ |
| `/(modal)/add` | Add artifact sheet | ✅ |
| `/(modal)/handle-share` | Share intent handler | ✅ |
| `/(modal)/artifact/[artifactId]` | Full artifact viewer | ✅ |
| `/(modal)/artifact-details/[artifactId]` | Tags + description | ✅ |
| `/(modal)/artifact-galleries/[artifactId]` | Assign to galleries | ✅ |
| `/(modal)/create-gallery` | Create gallery sheet | ✅ |
| `/(modal)/edit-gallery/[galleryId]` | Edit gallery sheet | ⚠️ not wired |
| `/(modal)/suggested-gallery-artifacts/[galleryId]` | Bulk add to gallery | ✅ |
