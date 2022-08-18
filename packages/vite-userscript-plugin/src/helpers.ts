export function removeDuplicates(arr: string | string[] | undefined): any[] {
  return [...new Set(Array.isArray(arr) ? arr : arr ? [arr] : [])]
}
