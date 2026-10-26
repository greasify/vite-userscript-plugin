import type { HeaderConfig } from '../types.js'

import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PLUGIN_NAME } from '../constants.js'
import { countHeaderLines } from '../sourcemap.js'

const ABSOLUTE_URL_RE = /^[a-z][a-z0-9+.-]*:/i

export interface RequireOffsetDirs {
  publicDir: string
  root: string
}

function toRequireList(value: HeaderConfig['require']): string[] {
  if (value == null) {
    return []
  }

  return Array.isArray(value) ? value.map(String) : [String(value)]
}

export function listRequireUrls(value: HeaderConfig['require']): string[] {
  return toRequireList(value).map(url => url.trim()).filter(Boolean)
}

function isInsideDir(parent: string, child: string): boolean {
  if (!parent) {
    return false
  }

  const rel = relative(resolve(parent), resolve(child))
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel))
}

function readIfFile(path: string): string | undefined {
  if (!existsSync(path)) {
    return
  }

  try {
    return readFileSync(path, 'utf8')
  } catch {}
}

function readPublicPath(publicDir: string, pathname: string): string | undefined {
  if (!publicDir) {
    return
  }

  let decoded = pathname
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return
  }

  const relativePath = decoded.replace(/^[/\\]+/, '')
  if (!relativePath || relativePath.includes('\0')) {
    return
  }

  const file = resolve(publicDir, relativePath)
  if (!isInsideDir(publicDir, file)) {
    return
  }

  return readIfFile(file)
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

export function readRequireSource(url: string, dirs: RequireOffsetDirs): string | undefined {
  const trimmed = url.trim()
  if (!trimmed) {
    return
  }

  if (trimmed.startsWith('file:')) {
    try {
      return readIfFile(fileURLToPath(trimmed))
    } catch {
      return
    }
  }

  if (ABSOLUTE_URL_RE.test(trimmed) || trimmed.startsWith('//')) {
    try {
      const parsed = new URL(trimmed, 'http://localhost')
      if (!isLocalHost(parsed.hostname)) {
        return
      }

      return readPublicPath(dirs.publicDir, parsed.pathname)
    } catch {
      return
    }
  }

  if (trimmed.startsWith('/')) {
    return readPublicPath(dirs.publicDir, trimmed)
  }

  const fromPublic = readPublicPath(dirs.publicDir, trimmed)
  if (fromPublic != null) {
    return fromPublic
  }

  const fromRoot = resolve(dirs.root, trimmed)
  if (!isInsideDir(dirs.root, fromRoot)) {
    return
  }

  return readIfFile(fromRoot)
}

/**
 * Managers prepend `@require` sources in header order. A require that does
 * not end with a newline is still followed by one, so the userscript starts
 * on the next line.
 */
export function countRequirePrefixLines(
  urls: readonly string[],
  dirs: RequireOffsetDirs,
  warn: (message: string) => void,
): number {
  let prefix = ''
  const warned = new Set<string>()

  for (const url of urls) {
    const source = readRequireSource(url, dirs)
    if (source == null) {
      if (!warned.has(url)) {
        warned.add(url)
        warn(`[${PLUGIN_NAME}] @require "${url}" is not a local file, sourcemap was not shifted for it`)
      }
      continue
    }

    prefix += source.endsWith('\n') ? source : `${source}\n`
  }

  return countHeaderLines(prefix)
}
