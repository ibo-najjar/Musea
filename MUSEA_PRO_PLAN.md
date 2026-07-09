# Musea Pro — Subscriptions Execution Guide

> This is a **step-by-step execution guide** written for an agent to follow literally.
> Do the steps in order. After each phase, run the stated check before moving on.
> Do **not** invent extra features. Match existing code style (tabs, Biome).

---

## 0. Context (read first)

Musea is an Expo + Convex visual-bookmarking app. It has **no monetization** today. The only
existing limit is a per-user 50/day AI-enrichment cap in `convex/artifacts.ts`. We are adding a
**Musea Pro** subscription sold through **Apple In-App Purchase via RevenueCat** (Apple rejects
external payment for unlocking in-app digital features — this is non-negotiable, so no
Stripe/Polar in-app).

**Business plan (final):**

| Tier | AI enrichment | Total saves | Semantic search | Price |
|---|---|---|---|---|
| Free | 50 / day *(already built)* | 100 lifetime | 10 / day | $0 |
| Pro | Unlimited | Unlimited | Unlimited | **$4.99/mo · $39.99/yr** |

- RevenueCat entitlement id: **`pro`** (exact, case-sensitive, must match everywhere).
- Products: `musea_pro_monthly`, `musea_pro_annual`.
- Scope for v1: **iOS only**, **no free trial** (both can be added later).
- Reference implementation to mirror patterns from: https://github.com/0rtbo/convexpo-revenuecat
  and the component it uses: https://github.com/ramonclaudio/convex-revenuecat

**Golden rule:** the client SDK (`react-native-purchases`) drives UI instantly; **Convex is the
authority** for anything that costs money. Every one of the three gates is enforced in a Convex
mutation/action that reads entitlement **server-side**. Never trust a client Pro flag or a
client-supplied `appUserId` for gating.

**Files you MUST read before editing** (to anchor exact line numbers, which may drift):
`convex/artifacts.ts`, `convex/http.ts`, `convex/convex.config.ts`, `convex/schema.ts`,
`convex/search.ts`, `convex/auth.ts`, `src/app/_layout.tsx`,
`src/app/(app)/(tabs)/(settings)/index.tsx`, `src/lib/auth-client.ts`, `src/lib/toast.ts`.

---

## PHASE A — Convex backend: entitlement source of truth

### A1. Add the RevenueCat Convex component

Install: `npm install convex-revenuecat`

Edit `convex/convex.config.ts` — add the component next to the existing two:
```ts
import betterAuth from "@convex-dev/better-auth/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
import revenuecat from "convex-revenuecat/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(betterAuth);
app.use(rateLimiter);
app.use(revenuecat);        // ← add
export default app;
```

### A2. Mount the webhook

Edit `convex/http.ts` (currently only mounts Better Auth):
```ts
import { httpRouter } from "convex/server";
import { RevenueCat } from "convex-revenuecat";
import { authComponent, createAuth } from "./auth";
import { components } from "./_generated/api";

const http = httpRouter();
authComponent.registerRoutes(http, createAuth);

const revenuecat = new RevenueCat(components.revenuecat, {
  REVENUECAT_WEBHOOK_AUTH: process.env.REVENUECAT_WEBHOOK_AUTH,
});
revenuecat.registerRoutes(http);   // mounts POST /webhooks/revenuecat

export default http;
```

### A3. Entitlement helpers module

Create `convex/revenuecat.ts`:
```ts
import { RevenueCat } from "convex-revenuecat";
import { components } from "./_generated/api";

export const revenuecat = new RevenueCat(components.revenuecat, {
  REVENUECAT_WEBHOOK_AUTH: process.env.REVENUECAT_WEBHOOK_AUTH,
});

// Re-exported for client use (redundant with SDK, handy for reactive UI).
export const { hasEntitlement, isSubscriber, getActiveSubscriptions, getCustomer } =
  revenuecat.api();
```

### A4. Server-side `isPro` helper (single source used by all gates)

Create `convex/lib/entitlement.ts`:
```ts
import type { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";
import { revenuecat } from "../revenuecat";

const PRO = "pro"; // must match REVENUECAT_ENTITLEMENT_ID / RevenueCat dashboard exactly

// appUserId is the Better Auth user._id (see Purchases.logIn on the client).
// NEVER accept appUserId from client args — always pass the authenticated user._id.
export async function isProUser(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  appUserId: string,
): Promise<boolean> {
  return await revenuecat.hasEntitlement(ctx, { appUserId, entitlement: PRO });
}
```
> Confirm the exact `hasEntitlement` call signature against the installed
> `convex-revenuecat` types after install; adjust arg names if the package differs.

### A5. Env var

Run: `npx convex env set REVENUECAT_WEBHOOK_AUTH "<paste openssl rand -base64 32 output>"`
Also (optional, matches reference repo convention): `npx convex env set REVENUECAT_ENTITLEMENT_ID "pro"`.

**CHECK A:** `npx convex dev` deploys with no errors. Convex dashboard shows a `revenuecat`
component with `customers` / `subscriptions` / `entitlements` / `webhookEvents` tables.

---

## PHASE B — The three gates (server-side enforcement)

### B1. AI enrichment — skip the quota for Pro

In `convex/artifacts.ts`, `createArtifact` handler. Current logic (~lines 62-70):
```ts
let willEnrich = !isTextOnly;
if (willEnrich) {
  const { ok } = await rateLimiter.limit(ctx, "aiEnrichment", { key: user._id });
  willEnrich = ok;
}
```
Change to (compute `isPro` once at the top of the handler and reuse for B1 + B2):
```ts
const isPro = await isProUser(ctx, user._id);

let willEnrich = !isTextOnly;
if (willEnrich && !isPro) {
  const { ok } = await rateLimiter.limit(ctx, "aiEnrichment", { key: user._id });
  willEnrich = ok;   // over free quota → falls through to scrapeArtifactMetadata (already built)
}
```
Add `import { isProUser } from "./lib/entitlement";` at top. Free behavior is unchanged.

### B2. Total-saves cap (Free = 100 lifetime)

Still in `createArtifact`, **before** the `ctx.db.insert("artificats", …)` (~line 72). Reuse the
existing `by_user` index and the `.take()` pattern already used elsewhere:
```ts
if (!isPro) {
  const existing = await ctx.db
    .query("artificats")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .take(101);
  if (existing.length > 100) {
    throw new ConvexError({ code: "FREE_LIMIT", limit: "saves", cap: 100 });
  }
}
```
- Import `ConvexError` from `convex/values` (already used in the codebase per CLAUDE.md pattern).
- Grandfathering: this blocks only *new* saves past 100. It never deletes existing artifacts.

### B3. Semantic search cap (Free = 10/day)

`convex/search.ts` `searchArtifacts` is currently ungated. Add a second limit to the **same**
rate-limiter config style used in `artifacts.ts`. Because `search.ts` is a Node action and the
rate limiter runs in a mutation/query context, do this:

1. Add the limit definition wherever the `RateLimiter` instance is created for search (create one
   in `search.ts` mirroring `artifacts.ts:16-19`):
   ```ts
   const rateLimiter = new RateLimiter(components.rateLimiter, {
     aiSearch: { kind: "fixed window", rate: 10, period: DAY },
   });
   ```
2. At the start of `searchArtifacts`, get the user (`api.auth.getCurrentUser`), then:
   ```ts
   const pro = await isProUser(ctx, user._id);
   if (!pro) {
     const { ok, retryAfter } = await rateLimiter.limit(ctx, "aiSearch", { key: user._id });
     if (!ok) throw new ConvexError({ code: "FREE_LIMIT", limit: "search", retryAfter });
   }
   ```
> If `rateLimiter.limit` cannot be called directly from the action context, follow the existing
> `convex/feedback.ts` pattern (it throws on limit with `retryAfter`) — call the limiter from the
> mutation/query that the search flow already runs, or wrap it. Verify the call site during build.

### B4. Plan query for the UI

Create `convex/plan.ts`:
```ts
import { query } from "./_generated/server";
import { api } from "./_generated/api";
import { isProUser } from "./lib/entitlement";

export const getMyPlan = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.runQuery(api.auth.getCurrentUser);
    if (!user) return { isPro: false };
    const isPro = await isProUser(ctx, user._id);
    // saves usage for the meter (cheap, capped read)
    const saves = await ctx.db
      .query("artificats")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(101);
    return {
      isPro,
      limits: { saves: 100, aiPerDay: 50, searchPerDay: 10 },
      usage: { saves: Math.min(saves.length, 100) },
    };
  },
});
```

**CHECK B:** `npx biome check .` exits 0. As a free user (no entitlement yet), the 101st save
throws `FREE_LIMIT`; the 11th search of the day throws `FREE_LIMIT`; AI still degrades at 50/day.

---

## PHASE C — Client SDK integration

### C1. Install (needs a dev build; will NOT work in Expo Go)

```bash
npx expo install expo-dev-client react-native-purchases react-native-purchases-ui
```
The config plugin is auto-added. A **full native rebuild** is required after install
(hot reload throws `NativeEventEmitter requires a non-null argument`).

### C2. Client env vars (`.env` / EAS)

```
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxx          # RevenueCat → Project → API keys (iOS)
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=pro
EXPO_PUBLIC_REVENUECAT_OFFERING_ID=default       # optional
```
(Add `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` later for Android.)

### C3. No-React SDK utilities — `src/lib/revenue-cat.ts` (new)

Thin wrappers around `react-native-purchases` (mirror the reference repo's `lib/revenue-cat/index.ts`):
`configurePurchases()`, `logInUser(userId)`, `logOutUser()`, `getOfferings()`,
`purchasePackage(pkg)`, `restorePurchases()`, `getCustomerInfo()`, and a
`hasProEntitlement(customerInfo)` helper that checks
`customerInfo.entitlements.active[process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID]`.

### C4. Provider + hooks — `src/components/revenue-cat-provider.tsx` (new)

- `RevenueCatProvider` calls `configurePurchases()` once on mount.
- Subscribes to `Purchases.addCustomerInfoUpdateListener` → keeps `isPro` in React state.
- A `useEffect` keyed on `authClient.useSession()`:
  - signed in → `logInUser(session.user.id)`
  - signed out → `logOutUser()`
- Exposes `useRevenueCat()` → `{ isPro, getPackages, purchasePackage, restorePurchases }`
  and a convenience `useIsPro()`.

Mount it in `src/app/_layout.tsx` inside the existing provider stack (wrap the app, near
`ConvexBetterAuthProvider`).

### C5. CRITICAL — sign-out ordering

Wherever the app signs out (`src/app/(app)/(tabs)/(settings)/index.tsx` "Sign out" at ~line 101,
and `delete-account`): call **`logOutUser()` (RevenueCat) BEFORE `authClient.signOut()`**, else a
stale RevenueCat identity carries into the next user.

**CHECK C:** app builds via EAS dev build and launches on a physical iPhone; `useIsPro()` returns
`false` for a fresh account; no runtime errors.

---

## PHASE D — Paywall & Settings UI

### D1. Paywall route — `src/app/(app)/(modal)/paywall.tsx` (new)

Use RevenueCat's **prebuilt paywall** from `react-native-purchases-ui`
(`RevenueCatUI.Paywall` component or `presentPaywall()`), configured in the RC dashboard. Present
as a form-sheet modal (match existing `(modal)/` routes). On successful purchase → dismiss and
toast success (`useAppToast` from `src/lib/toast.ts`).

### D2. Settings entries — `src/app/(app)/(tabs)/(settings)/index.tsx`

Add a new `ListGroup` at the **top** (above the "Account" group, ~line 56), using the existing
`ListGroupItem` pattern already in this file:
- **If `!isPro`:** `label="Upgrade to Pro ✦"`, `description="Unlimited AI, saves & search"`,
  `onPress={() => router.push("/paywall")}`.
- **If `isPro`:** `label="Musea Pro · Active"`, `onPress` → `Purchases.showManageSubscriptions()`.
- Always add a **"Restore Purchases"** `ListGroupItem` (Apple requires it) →
  `restorePurchases()` then `toast.success/error`.

Read `isPro` via `useIsPro()` (instant) — optionally cross-check `useQuery(api.plan.getMyPlan)`.

### D3. Paywall triggers on the gates

- `src/app/(app)/(modal)/add.tsx`: wrap the `createArtifact` call in try/catch; if the error is
  `FREE_LIMIT` / `saves`, show an inline card "You've reached 100 saves — Upgrade for unlimited"
  with a button → `router.push("/paywall")`. Optionally show a `getMyPlan` usage meter ("92/100").
- Discover search UI: catch `FREE_LIMIT` / `search` → toast + a paywall CTA.

**CHECK D:** free user hitting the save cap or search cap sees a paywall CTA (not a raw error);
Settings shows Upgrade when free and Manage when Pro; Restore runs without crashing.

---

## PHASE E — Dashboard / store setup (human-assisted; agent guides, cannot do alone)

1. **App Store Connect → Subscriptions:** subscription group "Musea Pro" with
   `musea_pro_monthly` ($4.99) + `musea_pro_annual` ($39.99); add localizations + review
   screenshot; complete Paid Apps agreement + banking/tax (App Review blocks without tax info).
2. **RevenueCat dashboard:** new project → add the App Store app → entitlement **`pro`** → offering
   with both products → design the Paywall (Monthly + Annual, annual "best value" badge) → set the
   **webhook** to `https://<deployment>.convex.site/webhooks/revenuecat` with `REVENUECAT_WEBHOOK_AUTH`
   as the Authorization header → copy the iOS public API key into `EXPO_PUBLIC_REVENUECAT_IOS_KEY`.
3. **Sandbox tester** (App Store Connect → Users and Access → Sandbox) for test purchases.
4. **App Privacy:** declare "Purchases" data type. Update `MUSEA_MVP.md` App Store section.

**Webhook test:** RC dashboard "Send test event" → Convex dashboard `revenuecat.webhookEvents`
table shows a row with `eventType: "TEST"`.

---

## Edge cases the implementation must respect (component handles most)

- **Cancel:** stays Pro until period end. **Refund/chargeback:** revoke immediately.
- **Grace period / billing retry:** stays Pro.
- **Webhook lag/offline:** client SDK unlocks UI instantly; server catches up in seconds. Server
  gates fail **closed** to free (safe). A just-purchased user might hit a free limit for a few
  seconds before the webhook lands — acceptable.
- **Restore / new device:** `restorePurchases()` re-links by `app_user_id`.
- **Existing users >100 saves:** never deleted; only new saves past 100 are blocked.

---

## Files touched (summary)

**New (backend):** `convex/revenuecat.ts`, `convex/lib/entitlement.ts`, `convex/plan.ts`.
**Edit (backend):** `convex/convex.config.ts`, `convex/http.ts`, `convex/artifacts.ts`
(`createArtifact` B1+B2), `convex/search.ts` (B3).
**New (client):** `src/lib/revenue-cat.ts`, `src/components/revenue-cat-provider.tsx`,
`src/app/(app)/(modal)/paywall.tsx`.
**Edit (client):** `src/app/_layout.tsx` (mount provider), settings `index.tsx` (Upgrade/Manage/
Restore + sign-out ordering), `add.tsx` (save-cap paywall), Discover search UI (search-cap paywall),
`delete-account.tsx` (sign-out ordering).
**Config:** `package.json` (+3 deps), Convex env `REVENUECAT_WEBHOOK_AUTH` (+`REVENUECAT_ENTITLEMENT_ID`),
client env `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `_ENTITLEMENT_ID` / `_OFFERING_ID`.
**Docs:** `MUSEA_MVP.md` (Pro tier + IAP steps).

---

## Final verification (end-to-end)

1. `npx biome check .` = 0; `npx convex dev` deploys clean.
2. **Free gates:** 101st save blocked → paywall; 11th search/day blocked → paywall; AI degrades at 50/day.
3. **Sandbox purchase:** buy monthly → paywall dismisses → Settings shows "Pro · Active" → all
   three limits stop blocking → `revenuecat.webhookEvents` logged the event → `api.plan.getMyPlan`
   returns `isPro:true`.
4. **Server authority proof:** fake client Pro without a real purchase → server mutations still
   enforce free limits.
5. **Lifecycle:** sandbox cancel → Pro until period end; refund → drops to free.
6. **Restore:** reinstall → `restorePurchases()` re-grants Pro.
7. **EAS dev build** installs and runs on a physical iPhone (IAP untestable in Expo Go / plain sim).

---

## What the user must provide (agent cannot self-serve)

1. RevenueCat account + project, and the **iOS public API key** for `EXPO_PUBLIC_REVENUECAT_IOS_KEY`.
2. App Store Connect subscription products `musea_pro_monthly` / `musea_pro_annual` created (Phase E).
3. A sandbox tester account for purchase testing.
4. The value for `REVENUECAT_WEBHOOK_AUTH` set both in Convex env and the RC dashboard webhook.

---

## Resources
- Expo IAP guide: https://docs.expo.dev/guides/in-app-purchases/
- RevenueCat × Expo: https://www.revenuecat.com/docs/getting-started/installation/expo
- convex-revenuecat component: https://github.com/ramonclaudio/convex-revenuecat
- Reference starter (same stack): https://github.com/0rtbo/convexpo-revenuecat
- RevenueCat webhooks: https://www.revenuecat.com/docs/integrations/webhooks
