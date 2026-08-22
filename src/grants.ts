import type { Grants } from "./types.js";
import { grants } from "./constants.js";

export function removeDuplicates<T>(arr: T | T[] | undefined): T[] {
  if (Array.isArray(arr)) {
    return [...new Set(arr)];
  }

  return arr ? [arr] : [];
}

export function defineGrants(code: string): Grants[] {
  const definedGrants: Grants[] = [];

  for (const grant of grants) {
    if (code.includes(grant)) {
      definedGrants.push(grant);
    }
  }

  return definedGrants;
}
