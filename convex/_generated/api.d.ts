/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as artifacts from "../artifacts.js";
import type * as auth from "../auth.js";
import type * as feedback from "../feedback.js";
import type * as files from "../files.js";
import type * as galleries from "../galleries.js";
import type * as galleryArtifacts from "../galleryArtifacts.js";
import type * as healthcheck from "../healthcheck.js";
import type * as http from "../http.js";
import type * as preview from "../preview.js";
import type * as search from "../search.js";
import type * as user from "../user.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  artifacts: typeof artifacts;
  auth: typeof auth;
  feedback: typeof feedback;
  files: typeof files;
  galleries: typeof galleries;
  galleryArtifacts: typeof galleryArtifacts;
  healthcheck: typeof healthcheck;
  http: typeof http;
  preview: typeof preview;
  search: typeof search;
  user: typeof user;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
