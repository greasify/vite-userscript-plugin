import type { HeaderConfig } from '../types.js'

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { styleText } from 'node:util'

export function serveReinstallFingerprint(header: HeaderConfig): string {
  return JSON.stringify({
    name: header.name,
    match: header.match,
    grant: header.grant,
  })
}

export function hasServeHeaderChanged(previous: string | undefined, next: string): boolean {
  return previous !== undefined && previous !== next
}

export function formatReinstallHint(): string {
  return styleText(
    'yellow',
    'Userscript @name, @match, or @grant changed. Reinstall the printed URL.',
  )
}

export function loadServeHeaderFingerprints(file: string): Map<string, string> {
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return new Map()
    }

    return new Map(
      Object.entries(parsed).filter((entry): entry is [string, string] => {
        return typeof entry[1] === 'string'
      }),
    )
  } catch {
    return new Map()
  }
}

export function saveServeHeaderFingerprints(file: string, fingerprints: Map<string, string>): void {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${JSON.stringify(Object.fromEntries(fingerprints))}\n`)
}

export function createServeReinstallTracker(initial?: Map<string, string>) {
  const fingerprints = new Map(initial)

  const consume = (fileName: string, header: HeaderConfig): boolean => {
    const next = serveReinstallFingerprint(header)
    const changed = hasServeHeaderChanged(fingerprints.get(fileName), next)
    fingerprints.set(fileName, next)
    return changed
  }

  return {
    consume,
    fingerprints,
  }
}
