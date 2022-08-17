import type { Grants } from './types'

const initialGrants: Grants[] = [
  'GM_addStyle'
]

export function mergeGrants(grants: Grants[] | undefined) {
  if (Array.isArray(grants)) {
    return [...new Set([...grants, ...initialGrants])]
  }

  return initialGrants
}
