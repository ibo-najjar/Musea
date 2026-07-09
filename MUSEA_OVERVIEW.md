# Musea — App Overview & Status

> A shareable snapshot of what Musea is and where the project stands. For the
> detailed engineering plan, see [`MUSEA_MVP.md`](./MUSEA_MVP.md).

---

## The Idea

**Musea is a visual library for everything worth keeping.**

Save a link, an image, or a quote — from Safari, another app, or inside Musea —
and it instantly becomes a clean, scannable card. Musea reads what you saved,
enriches it with a title, summary, and tags, and files it into the right
gallery for you. No folders to fuss over, no tags to remember.

**The promise:** *One tap. Auto-organized. Musea puts it in the right place.*

**Who it's for:** People who save a lot of things across the web — links,
images, screenshots, quotes — and want them organized and instantly findable
without manual filing. Think of it as a visual Pinterest meets Pocket, but the
organizing happens for you.

### What makes it different
- **Save anything** — URLs, images, and quotes, including straight from the OS
  share sheet.
- **Beautiful by default** — rich previews, a masonry grid, inline video, and
  full-screen image zoom.
- **Organized for you** — AI reads each save and sorts it into topic galleries
  automatically.
- **Find it by meaning** — vector search understands intent, not just keywords,
  so the right item surfaces in milliseconds.
- **Private** — your library is scoped to your account; no ads, no tracking.

---

## Where I'm At

**Target:** iOS App Store public launch · **Scale goal:** 1k+ users

The app is **built and functional end-to-end**. Core save → enrich → organize →
search loop works. The remaining effort is enrichment quality, a few
convenience features, polish, and App Store submission.

### Snapshot

| Area | State |
|---|---|
| Core app (save, view, search, galleries) | ✅ Working |
| Auth (Apple + Google) | ✅ Working |
| Backend security & performance hardening | ✅ Done |
| AI enrichment | 🟡 Works, needs quality tuning |
| Add media from device (photo/video picker) | ⛔ Not built |
| Error handling & toasts | ⛔ Not built |
| App Store submission prep | ⛔ Not started |
| Smart Auto-Organization v2 (embedding-based filing) | 📋 Designed, not built |

---

## Built & Working

- **Auth** — Sign in with Apple + Google, animated onboarding carousel.
- **Save a URL** — Server-side link preview, AI enrichment, auto-gallery filing.
- **Save text/quotes** — Styled quote cards.
- **View artifacts** — Masonry grid, image zoom, inline video, embed player.
- **Vector search** — Meaning-based search over embeddings, live results.
- **Galleries** — Create, edit, delete (with cascade), 2-column grid with live
  cover previews, gallery detail view.
- **Organize artifacts** — Assign items to galleries (multi-select, batch save),
  suggested-artifacts flow, auto-generated gallery badges.
- **Share intent** — OS share sheet auto-fills the Add modal.
- **Profile & settings** — Avatar upload, display-name editing, real username,
  Privacy/Terms screens, delete-account (cascade).
- **Discover sort & filter** — Multi-select filtering by type, sort by date.
- **Duplicate detection** — Warns when saving a URL you already have.
- **Polish** — Branded source icons for 20+ domains, empty states.

### Hardening already shipped
Backend is production-grade: per-user auth/ownership guards on every query and
mutation, cursor pagination (no full-table scans), and AI rate limiting
(50 saves/user/day).

---

## Remaining Before Launch

1. **Enrichment quality** — Strengthen the AI prompt for specific titles and
   clean tags; decide how quotes get enriched so they're searchable.
2. **Add media from device** — Photo/video picker in the Add modal (the upload
   path already exists from avatar uploads).
3. **Error handling & toasts** — Add a toast system for success/error feedback
   and an error boundary.
4. **App Store prep** — Store-configure `eas.json`, add `PrivacyInfo.xcprivacy`,
   audit permission strings, host Privacy Policy + Terms publicly, create a demo
   review account, capture screenshots, and run a TestFlight beta.

---

## On the Roadmap: Smart Auto-Organization v2

Today, auto-filing picks one topic from a fixed list and matches galleries by
exact title — so the AI is invisible, galleries the user creates never get
auto-filled, and near-duplicate buckets ("Tech" vs "Technology") appear.

The redesign (fully specced, not yet built) makes filing **embedding-based**:
- New saves are matched to *your existing galleries* by meaning and filed
  silently (with an undoable "Filed in ___" toast).
- When enough unsorted-but-related items accumulate, a **Suggested gallery**
  appears inline for you to Approve or Dismiss.
- One unified gallery pool — the galleries you name become the taxonomy the AI
  works within.

This is the feature that makes the "auto-organized" promise actually true.

---

## Tech Stack (for reference)

Expo / React Native · Expo Router · Convex backend · Better Auth (Apple +
Google) · Vercel AI SDK with `gpt-4o-mini` + `text-embedding-3-small` (1536-dim
embeddings) · NativeWind + heroui-native styling · FlashList masonry.
