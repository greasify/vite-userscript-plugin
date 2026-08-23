import type { HeaderConfig } from '../types.js'
import type { Grants } from './types.js'

import { grants } from './catalog.js'
import { defineGrants, removeDuplicates } from './scan.js'

export function withServeGrants(header: HeaderConfig): HeaderConfig {
  if (header.grant === 'none') {
    return header
  }

  return {
    ...header,
    grant: [...new Set([...(header.grant ?? []), ...grants])],
  }
}

export function withBuildGrants(header: HeaderConfig, code: string, extraGrants: readonly Grants[] = []): HeaderConfig {
  if (header.grant === 'none') {
    return header
  }

  return {
    ...header,
    grant: removeDuplicates([
      ...defineGrants(code),
      ...removeDuplicates(header.grant),
      ...extraGrants,
    ]),
  }
}

export { withBuildGrants as resolveBuildHeader }
