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

### ✅ Sprint work since shipped (resolved)

All Week 1 security/backend work and most of Week 2 features are now done:

| Was | Now |
|---|---|
| Gallery edit (dummy-data) | `updateGallery` added, screen wired, dummy-data removed ✅ |
| Gallery delete (empty) | `deleteGallery` (cascade) wired with confirm alert ✅ |
| Artifact delete (empty) | `deleteArtifact` (cascade) wired with confirm alert ✅ |
| Create-gallery "Heyyyy" | Real Zod `FieldError` ✅ |
| Auto-gallery badge | Sparkle "Auto-generated" section + `isAuto`/`dismissed`/`promoteGallery` ✅ |
| Discover sort/filter | Fully wired multi-select + prominent ellipsis ✅ |
| Settings account/username/legal/delete | Real username, profile edit, Privacy/Terms screens, `deleteAccount` mutation ✅ |
| `listArtifacts`/`listGalleries` leaked all users | Auth + ownership guards everywhere ✅ |
| `addArtifactToGallery` `"anonymous"` | Real `userId` from `ctx.auth` ✅ |
| Galleries search bar (was dead) | Client-side title filter over `listUserGalleries` — filters manual grid + auto section live, `EmptyState` on no match ✅ |
| `patchArtifact`/`deleteArtifact` no ownership | Ownership checks added ✅ |
| `patchArtifact` exposed `status`/`embedding` | Validator restricted to safe fields ✅ |
| `by_creation_time` index bug | Solved via `by_user` + `.order()` ✅ |
| `.collect()` full scans | Cursor pagination + `.take()` caps ✅ |
| No rate limiting | `@convex-dev/rate-limiter`, 50/user/day ✅ |
| Duplicate detection (was planned) | `findArtifactByUrl` + warning card ✅ |

### ⛔ Genuinely remaining (see "Remaining Work" below)

| Feature | Status |
|---|---|
| Enrich prompt engineering | Functional but thin; text-only artifacts never enriched |
| Add media from device | `add.tsx` is URL/text only — no photo/video picker |
| Error handling & toasts | No toast lib, no error boundary; ad-hoc inline errors |
| App Store prep | `eas.json` not store-configured; no `PrivacyInfo.xcprivacy`; permission strings unaudited |

---

## Remaining Work

### 1. Galleries search bar ✅ DONE
**File:** `src/app/(app)/(tabs)/(galleries)/index.tsx`

Client-side title filter over the already-loaded `listUserGalleries` results (no backend change). Mirrors the Discover screen's `Stack.SearchBar` wiring.

- [x] `const [query, setQuery] = useState("")`
- [x] `onChangeText={(e) => setQuery(e.nativeEvent.text)}` + `onCancelButtonPress={() => setQuery("")}` on `Stack.SearchBar`
- [x] Derive `filteredManual`/`filteredAuto` via `title.toLowerCase().includes(query.trim().toLowerCase())`
- [x] "Auto-generated" footer gates on `filteredAuto.length > 0` (header auto-hides when no auto matches); `EmptyState` via `ListEmptyComponent` (guarded by `filteredAuto.length === 0`) when nothing matches
- [ ] Verify on simulator: typing filters both manual grid and auto section live; clearing restores full list

### 2. Enrich prompt engineering
**File:** `convex/ai.ts`

Current prompt is a single short system line and never runs for text-only artifacts (`createArtifact` only schedules enrichment when `!isTextOnly`).

- [ ] Strengthen the system prompt: define each field's intent, demand specificity (no generic "Interesting article" titles), enforce lowercase single/two-word tags, and bias `galleryTopic` toward the fixed list — only "Other" when nothing fits
- [ ] Improve the user message: include `text` content for quote artifacts, and label which signal is strongest (URL path vs. OG title vs. image)
- [ ] Decide + implement text-only enrichment: either (a) run a lighter enrichment (tags + topic + embedding, keep user's text as-is) so quotes get auto-filed and become searchable, or (b) explicitly document that quotes are intentionally not enriched. *Recommend (a)* — embeddings are what power vector search; unembedded quotes never surface in search.
- [ ] Keep the existing `try/catch` → `status:"failed"` fallback and the rate-limit gate
- [ ] Verify: saving a URL yields a specific title + 2–5 clean tags + a sensible auto-gallery; (if (a)) saving a quote produces tags and appears in search

### 3. Add media from device (Add modal)
**Files:** `src/app/(app)/(modal)/add.tsx`, `convex/files.ts` (reuse existing upload), `convex/artifacts.ts`

`expo-image-picker` + `expo-media-library` are already installed and used by profile/onboarding — reuse that upload path.

- [ ] Add a "Choose photo or video" button (and optional camera) above/below the URL field; use `ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images','videos'] })`
- [ ] Upload the picked asset to Convex file storage (reuse the avatar upload flow in `profile.tsx` / `convex/files.ts` — `generateUploadUrl` → POST → store URL)
- [ ] Show a local preview before save (reuse the existing preview block)
- [ ] On save: call `createArtifact` with `image` (photo) or `videoUrl` (video); these are media artifacts, so **no AI enrichment** is scheduled (matches current text-only behavior) — confirm `createArtifact`'s `willEnrich` logic still skips them (it only enriches when `sourceUrl` is set)
- [ ] Audit `app.json` for `NSPhotoLibraryUsageDescription` / `NSCameraUsageDescription` purpose strings (ties into App Store prep below)
- [ ] Verify: pick image → preview → save → appears in Discover grid; pick video → inline video card plays

### 4. Error handling & toasts (was Day 11–12)
**Files:** `src/app/_layout.tsx`, new `src/lib/toast.ts`, affected modals

- [ ] Add a lightweight toast (Reanimated-based or `react-native-toast-message`); mount in root `_layout.tsx`
- [ ] Success toasts: save artifact, create/update/delete gallery, delete artifact, update profile, delete account
- [ ] Error toasts for caught mutation failures (replace ad-hoc inline `error` state where it makes sense)
- [ ] Wrap root layout body in an error boundary (`react-error-boundary`)
- [ ] In-flight disable on destructive buttons to prevent double-tap (delete-account already does this)

### 5. App Store prep (was Day 13–14)
**Files:** `app.json`, `eas.json`, `PrivacyInfo.xcprivacy`

- [ ] `eas.json`: add `"distribution": "store"` to production build; fill `submit.production` with Apple credentials
- [ ] Verify bundle ID `com.ibonajjar.musea` (production variant), version `1.0.0`, build number, display name in `app.json`
- [ ] Audit permission purpose strings — remove unused camera + microphone permissions (features not shipped); keep photo library
- [ ] Add `PrivacyInfo.xcprivacy` (UserDefaults, file timestamps, system boot time — iOS 17+ required reasons)
- [ ] Host Privacy Policy + Terms publicly (currently in-app only at `src/constants/legal.ts`) — App Store requires a public Privacy Policy URL
- [ ] Create a demo email/password account for App Review (email/password login is enabled)
- [ ] 6.7" + 6.1" screenshots (≥3 each); TestFlight build → invite ≥2 testers → fix crashes before public submit

#### App Store Connect — v1.0.0 Listing

**Prerequisites before filling the dashboard:**
1. Host legal docs → capture `PRIVACY_URL` + `TERMS_URL` + `SUPPORT_URL` (GitHub Pages or any static host)
2. Ensure submitted build uses bundle id `com.ibonajjar.musea` (production variant, not `.dev`/`.preview`)
3. Create test email/password account for App Review section

**App Information**

| Field | Value |
|---|---|
| Name | `Musea` |
| Subtitle (≤30) | `Save anything, find it fast` |
| Primary Category | Productivity |
| Content Rights | Check "contains third-party content" — app fetches OG previews of user-supplied URLs |
| Age Rating | Target **4+**. ⚠️ The "Unrestricted Web Access" question: `expo-web-browser` opens user-saved URLs in SFSafariViewController — most reviewers accept 4+, but be prepared for a 17+ bump |

**App Privacy ("nutrition label")**

Does this app track you? → **No** (zero analytics/ads/tracking SDKs).
Declare these types (all: Linked to Identity = Yes, Tracking = No, Purpose = App Functionality):

| Apple category | Type | Why |
|---|---|---|
| Contact Info | Email Address | Account identity (OAuth / email signup) |
| Contact Info | Name | Display name / profile |
| User Content | Photos or Videos | Profile avatar + images saved to galleries |
| User Content | Other User Content | Saved bookmarks, quotes, gallery titles, in-app feedback |
| Identifiers | User ID | `userId` stamped on all Convex tables |

Do **not** declare: Search History (queries not persisted), Diagnostics (no analytics SDK).

**Listing copy**

Promotional Text (≤170 chars, editable without re-review):
```
Save links, images, and quotes into one beautiful, searchable library. Musea auto-tags and files everything with AI, so you can find anything the moment you need it.
```

Description (≤4000):
```
Musea is your visual library for everything worth keeping.

Save a link, an image, or a quote, and Musea instantly turns it into a clean, scannable card — then files it into the right gallery for you, automatically. No folders to fuss over, no tags to remember.

WHY MUSEA
• Save anything — paste a URL, drop an image, or capture a quote. Share straight from Safari and other apps.
• Beautiful by default — rich previews, a masonry grid, inline video, and full-screen image zoom.
• Organized for you — AI reads what you save and sorts it into topic galleries automatically. Promote the ones you love.
• Find it instantly — smart search understands meaning, not just keywords, so the right item surfaces in milliseconds.
• Yours alone — your library is private to your account.

HOW IT WORKS
1. Save something — a link, photo, or note.
2. Musea enriches it with a title, summary, and tags.
3. It lands in a gallery, ready to rediscover whenever you need it.

Sign in with Apple or Google and start building your library in seconds.
```

Keywords (≤100 chars):
```
bookmark,save,visual,links,gallery,organize,reading,collection,curate,moodboard,notes,clipper
```

| Field | Value |
|---|---|
| Support URL | `SUPPORT_URL` |
| Privacy Policy URL | `PRIVACY_URL` |
| Version | `1.0.0` |
| Copyright | `2026 Ibrahim Najjar` |
| What's New | `Welcome to Musea — your visual library for everything worth keeping.` |

Screenshots: 6.7" (1290×2796) and 6.1" (1179×2556), ≥3 each. Suggested: home grid, add → enriched card, topic gallery, search results, artifact detail.

**App Review Information**

| Field | Value |
|---|---|
| Sign-in required | Yes |
| Demo account | email/password test account (create from Prerequisite 3) |
| Contact email | `ibonajjar.dev@gmail.com` |
| Notes | `Musea is a personal visual bookmarking app. Saved links/images are enriched via OpenAI (titles, tags, embeddings) and organized into galleries. No ads, no third-party tracking/analytics. Email/password demo account provided; Sign in with Apple/Google also supported.` |

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

#### Day 8–10 · Settings screen
**File:** `src/app/(app)/(tabs)/(settings)/index.tsx`, `convex/user.ts`

- [ ] Fix hardcoded `@ibrahimnajjar` — read `session?.user.name` or a `username` field from Convex user record
- [ ] Wire "Account settings" `onPress` to a profile edit modal (display name, avatar — already built at `(settings)/profile`)
- [ ] Add a **Legal** section with two items: "Privacy Policy" and "Terms of Service" (open in `WebBrowser.openBrowserAsync`)
- [ ] Add a **Danger** section with "Delete account" — calls a `deleteAccount` mutation that removes the user's artifacts, galleries, galleryArtifacts rows, and the user record, then signs out
- [ ] Add `deleteAccount` mutation to `convex/user.ts` with ownership guard; cascade-delete all user data

#### Day 10 · Auto-gallery visual badge
**Files:** `src/components/gallery-card.tsx`, `src/app/(app)/(tabs)/(galleries)/gallery/[galleryId].tsx`

- [ ] `GalleryCard`: when `gallery.isAuto === true`, overlay a small sparkle (✦ or SF Symbol `sparkles`) badge on the card
- [ ] Gallery detail header: add "Auto-generated" subtitle line when `isAuto === true`

#### Day 10–11 · Sort & Filter (Discover)
**Files:** `convex/artifacts.ts`, `src/app/(app)/(tabs)/(discover)/index.tsx`

- [ ] Extend `listArtifacts` args: `sortDir?: "desc" | "asc"`, `filterTypes?: ("image" | "video" | "quote" | "link")[]` (multi-select)
- [ ] Apply `.order(sortDir ?? "desc")` on the existing `by_user` index (date sort, no new index)
- [ ] Apply `.filter(...)` before `.paginate(...)`: OR the per-type predicates of the selected types — image → image set; video → videoUrl set; quote → text set AND image unset; link → source set
- [ ] Lift `sortDir` + `filterTypes` state into `HomeScreen` (with `toggleFilter`/`clearFilters`); pass `filterTypes: filterTypes.length ? filterTypes : undefined`
- [ ] Rewire the toolbar menu: Sort = Newest / Oldest (`isOn`); Filter = multi-select toggles (Images / Videos / Quotes / Links); a destructive "Remove filters" action shown (`hidden={!hasFilters}`) only when filters are active
- [ ] Make the ellipsis prominent when filtering: `variant={hasFilters ? "prominent" : "plain"}` + accent `tintColor` + filled icon
- [ ] Sort/filter affect the browse list only; when `isSearch`, leave vector-search results untouched

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

### Sort & Filter (Discover)
Make the existing Discover toolbar menu functional.

```
Backend (convex/artifacts.ts → listArtifacts):
  args += sortDir?: "desc"|"asc", filterTypes?: ("image"|"video"|"quote"|"link")[]
  ctx.db.query("artificats")
    .withIndex("by_user", q => q.eq("userId", user._id))
    .order(sortDir ?? "desc")
    .filter(q => q.or(...selectedTypePredicates))   // omitted when filterTypes empty
    .paginate(paginationOpts)

  type predicates:
    image → q.neq(field("image"), undefined)
    video → q.neq(field("videoUrl"), undefined)
    quote → q.and(q.neq(field("text"), undefined), q.eq(field("image"), undefined))
    link  → q.neq(field("source"), undefined)

UI (discover/index.tsx):
  lift {sortDir, filterTypes} to HomeScreen → query args (toggleFilter / clearFilters)
  Sort By: Newest (default) · Oldest
  Filter: Images · Videos · Quotes · Links   (multi-select, isOn reflects state)
          + "Remove filters" (destructive, hidden unless any selected)
  Ellipsis button: variant "prominent" + accent tint when filters active
```

> Note: `.filter()` over a paginated query can return <24 items per page; `usePaginatedQuery`/`loadMore` handles this. If type-filtering feels slow at scale, add a `type` field + `by_user_type` index (out of scope for v1).

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
- [ ] **Sort & Filter**: Discover "Oldest" reverses order; selecting "Images" + "Videos" shows both types (multi-select); ellipsis turns prominent + "Remove filters" appears when active; clearing restores all; controls don't affect active search results
- [ ] **Settings**: Username shows real value; Privacy Policy link opens; Delete account removes all data and signs out
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
