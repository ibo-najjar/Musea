# Musea MVP

Visual bookmarking app — save anything, find it instantly. Items are **artifacts**, collections are **galleries**.

---

## App Concept

iOS app that lets users save online content (X posts, YouTube videos, Reddit posts, articles, images) via share sheet or pasted URL. Each saved item is processed into a Pinterest-style card with AI-generated title, summary, tags, and embeddings for semantic search. Items are auto-sorted into topic galleries.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Expo 56, React Native 0.85 |
| Navigation | Expo Router (file-based) |
| Backend | Convex |
| Auth | BetterAuth + Google OAuth |
| AI | Vercel AI SDK (`ai`, `@ai-sdk/openai`) |
| Styling | NativeWind + Uniwind + heroui-native |
| Glass UI | expo-glass-effect |
| Lists | FlashList (masonry) |

---

## What's Built

### Backend (`convex/`)

| File | What it does |
|---|---|
| `schema.ts` | `artificats` table with `tags`, `status` (pending/ready/failed), `embedding` (float64[1536]) + vector index |
| `artifacts.ts` | CRUD — `createArtifact` schedules AI enrichment on save; `getArtifactByIdInternal` + `patchArtifactInternal` for internal use |
| `ai.ts` | `enrichArtifact` internal action — calls GPT-4o-mini with OG image + text → generates title, summary, tags, gallery topic; generates text-embedding-3-small embedding; auto-assigns artifact to topic gallery |
| `search.ts` | `searchArtifacts` action — embeds query, runs Convex vector search (1536-dim), returns ranked artifacts |
| `galleries.ts` | Gallery CRUD + `findOrCreateAutoGallery` internal mutation — finds or creates an AI auto-gallery by topic and links the artifact |
| `preview.ts` | Scrapes OG tags from URL; checks `twitter:player:image` first for X video posts; discards profile images (`/profile_images/` URLs) |

### Frontend (`src/`)

| File | What it does |
|---|---|
| `app/(app)/(tabs)/index.tsx` | Home screen — masonry grid + live semantic search bar (debounced 600ms), skeleton while loading/searching |
| `components/mansory-card.tsx` | Card with image (no-op placeholder when no image to avoid FlashList recycling ghost images) + absolute "Processing..." glass pill while `status === "pending"` |

### Auth
- Google OAuth via BetterAuth + Convex
- Protected routes in root layout

### Galleries
- User-created galleries (manual)
- AI auto-galleries (`isAuto: true`) — created automatically by topic (Design, Travel, Tech, Food, etc.)

---

## Key Decisions

- **AI SDK**: Vercel AI SDK with `@ai-sdk/openai` (already in deps)
- **Embeddings**: `text-embedding-3-small` (1536 dims) stored in Convex vector index
- **Blocked sources**: Instagram, TikTok etc. skipped for MVP (scraping returns nothing useful)
- **X/Twitter video**: `twitter:player:image` checked first; profile picture URLs discarded
- **FlashList recycling fix**: Cards with no image render a plain `View` placeholder, not `<Image uri={undefined}>`

---

## Env Vars Required

```
OPENAI_API_KEY=sk-...   # set in Convex: npx convex env set OPENAI_API_KEY sk-...
```

---

## Screens

| Route | Screen |
|---|---|
| `/(tabs)/` | Home — masonry artifact grid + search |
| `/(tabs)/add` | Add artifact — paste URL, live OG preview, save |
| `/(tabs)/(galleries)/` | Galleries list |
| `/(tabs)/(galleries)/gallery/[galleryId]` | Gallery detail |
| `/(tabs)/(settings)/` | Settings / profile |
| `/(modal)/artifact/[artifactId]` | Full artifact viewer |
| `/(modal)/create-gallery` | Create gallery sheet |
| `/(modal)/artifact-galleries/[artifactId]` | Assign artifact to galleries |

---

## What's Left (Post-MVP)

- Share sheet completion (`+native-intent.ts` + `handle-share.tsx`)
- Artifact detail modal showing full tags
- Auto-gallery visual distinction from user galleries
- Favorites
- Profile editing
- Edit gallery modal
