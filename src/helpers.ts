import { transformWithEsbuild } from 'vite'
import { grants } from './constants.js'
import type { Grants, Transform } from './types.js'

export function removeDuplicates(arr: any): any[] {
  return [...new Set(Array.isArray(arr) ? arr : arr ? [arr] : [])]
}

export async function transform({
  minify,
  file,
  name,
  loader
}: Transform): Promise<string> {
  const { code } = await transformWithEsbuild(file, name, {
    minify,
    loader,
    sourcemap: false,
    legalComments: 'none'
  })

  return code
}

export function defineGrants(code: string): Grants[] {
  const definedGrants: Grants[] = []

  for (const grant of grants) {
    if (code.indexOf(grant) !== -1) {
      definedGrants.push(grant)
    }
  }

  return definedGrants
}
