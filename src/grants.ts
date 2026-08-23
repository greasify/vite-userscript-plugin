import type { Grants } from "./types.js";
import { grants } from "./constants.js";

const grantMatchers = grants.map(grant => ({
  grant,
  pattern: new RegExp(`\\b${grant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`),
}));

export function removeDuplicates<T>(arr: T | T[] | undefined): T[] {
  if (Array.isArray(arr)) {
    return [...new Set(arr)];
  }

  return arr ? [arr] : [];
}

export function defineGrants(code: string): Grants[] {
  return grantMatchers
    .filter(({ pattern }) => pattern.test(code))
    .map(({ grant }) => grant);
}
