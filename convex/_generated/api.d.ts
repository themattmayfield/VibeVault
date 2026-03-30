/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as achievements from "../achievements.js";
import type * as checkIns from "../checkIns.js";
import type * as dateHelpers from "../dateHelpers.js";
import type * as goals from "../goals.js";
import type * as groups from "../groups.js";
import type * as insights from "../insights.js";
import type * as journals from "../journals.js";
import type * as mood from "../mood.js";
import type * as organization from "../organization.js";
import type * as user from "../user.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  achievements: typeof achievements;
  checkIns: typeof checkIns;
  dateHelpers: typeof dateHelpers;
  goals: typeof goals;
  groups: typeof groups;
  insights: typeof insights;
  journals: typeof journals;
  mood: typeof mood;
  organization: typeof organization;
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

export declare const components: {};
