import type { Grants } from './grants/types.js'

export type {
  GMDotAlias,
  GMLiterals,
  GMWindow,
  Grants,
} from './grants/types.js'

export type RunAt
  = | 'document-start'
    | 'document-body'
    | 'document-end'
    | 'document-idle'
    | 'context-menu'

export type HeaderConfig = {
  [property: string]: any

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:name
   */
  'name': string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:namespace
   */
  'namespace'?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:copyright
   */
  'copyright'?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:version
   */
  'version': string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:description
   */
  'description'?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:icon
   */
  'icon'?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:icon
   */
  'iconURL'?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:icon
   */
  'defaulticon'?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:icon64
   */
  'icon64'?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:icon64
   */
  'icon64URL'?: string

  /**
   * `@grant none` disables GM APIs. Do not mix with auto-detected grants.
   *
   * @see https://www.tampermonkey.net/documentation.php#meta:grant
   */
  'grant'?: Grants[] | 'none'

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:author
   */
  'author'?: string

  /**
   * Script homepage. Also the base for relative `icon`, `iconURL`,
   * `defaulticon`, `icon64`, `icon64URL`, `require`, `resource`, `supportURL`,
   * `updateURL`, and `downloadURL`. Absolute `http(s):` URLs stay as-is.
   * `updateURL` / `downloadURL` of `none` are not joined.
   *
   * Fallback order: `homepage`, `homepageURL`, `website`, `source`.
   *
   * @see https://www.tampermonkey.net/documentation.php#meta:homepage
   */
  'homepage'?: string

  /**
   * Alias of `homepage`. Used as the relative-URL base when `homepage` is empty.
   *
   * @see https://www.tampermonkey.net/documentation.php#meta:homepage
   */
  'homepageURL'?: string

  /**
   * Alias of `homepage`. Used as the relative-URL base when `homepage` and
   * `homepageURL` are empty.
   *
   * @see https://www.tampermonkey.net/documentation.php#meta:homepage
   */
  'website'?: string

  /**
   * Alias of `homepage`. Used as the relative-URL base when `homepage`,
   * `homepageURL`, and `website` are empty.
   *
   * @see https://www.tampermonkey.net/documentation.php#meta:homepage
   */
  'source'?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:antifeature
   */
  'antifeature'?: [type: string, description: string][]

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:require
   */
  'require'?: string[] | string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:resource
   */
  'resource'?: [key: string, value: string][]

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:include
   */
  'include'?: string[] | string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:match
   * @see https://violentmonkey.github.io/api/metadata-block/#match--exclude-match
   */
  'match': string[] | string

  /**
   * @see https://violentmonkey.github.io/api/metadata-block/#match--exclude-match
   */
  'exclude-match'?: string[] | string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:exclude
   */
  'exclude'?: string[] | string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:run_at
   */
  'run-at'?: RunAt

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:sandbox
   */
  'sandbox'?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:connect
   */
  'connect'?: string[] | string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:noframes
   */
  'noframes'?: boolean

  /**
   * `none` disables update checks. It is not joined with homepage.
   *
   * @see https://www.tampermonkey.net/documentation.php#meta:updateURL
   */
  'updateURL'?: 'none' | (string & {})

  /**
   * `none` disables update checks (pinned / non-latest installs). It is not joined with homepage.
   *
   * @see https://www.tampermonkey.net/documentation.php#meta:downloadURL
   */
  'downloadURL'?: 'none' | (string & {})

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:supportURL
   */
  'supportURL'?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:webRequest
   */
  'webRequest'?: string[]

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:unwrap
   */
  'unwrap'?: boolean
}

export type ServerOpen = boolean | 'user' | 'proxy'

export type ResolvedServerOpen = false | 'dev' | 'user' | 'proxy'

export interface ServerConfig {
  /**
   * Open the install target when Vite starts.
   * `true`: HMR → `.dev.user.js`; `file` → `{fileName}.user.js`.
   * `'user'` / `'proxy'`: file-mode install URL. Vite opens one path.
   *
   * @default false
   */
  open?: ServerOpen

  /**
   * Prefix applied to `@name` in serve mode.
   * Set `false` to disable.
   *
   * @default 'server:'
   */
  prefix?: string | false

  /**
   * Watch-build into `outDir`: `{fileName}.user.js`, headerless `{fileName}.js`,
   * and `{fileName}.proxy.user.js` with `@require file://` pointing at the IIFE.
   * Install `/{fileName}.user.js` (Firefox-safe) or the proxy URL. No HMR for this script.
   *
   * @default false
   */
  file?: boolean
}

export type HeaderMode = 'serve' | 'build' | 'meta'

export interface HeaderGenerateContext {
  userscript: string
  mode: HeaderMode
}

export interface ExternalRequire {
  /**
   * Global name the `@require` script assigns (e.g. `$`, `Vue`).
   */
  global: string

  /**
   * Absolute URL added to `@require`.
   */
  url: string
}

export type UserscriptExternal = Record<string, string | ExternalRequire>

export interface ResolvedExternal {
  specifier: string
  global: string
  url: string
}

/**
 * One userscript. Pass an object, or an array of these, to {@link UserscriptPluginConfig}.
 */
export interface UserscriptConfig {
  /**
   * Path of the userscript entry.
   */
  entry: string

  /**
   * Output base name (`{fileName}.user.js`).
   *
   * @default sanitized `header.name`
   */
  fileName?: string

  /**
   * Userscript header (`name`, `version`, `match` required).
   */
  header: HeaderConfig

  /**
   * Serve-mode options.
   */
  server?: ServerConfig

  /**
   * Extra spaces after the longest `@key`, or `false` for a single space.
   *
   * @default 1
   */
  headerAlign?: number | false

  /**
   * Rewrite the generated metablock.
   */
  generate?: (ctx: HeaderGenerateContext) => string

  /**
   * Derive `updateURL` / `downloadURL` from `homepage`, `homepageURL`,
   * `website`, or `source` when those fields are empty. Warns if no homepage
   * alias is set, or if `metaFile` is `false` (`@updateURL` would point at a
   * missing file).
   *
   * @default false
   */
  autoMetaUrls?: boolean

  /**
   * Emit `{fileName}.meta.js` alongside the userscript.
   * Keep enabled when using `autoMetaUrls`, otherwise `@updateURL` 404s.
   *
   * @default true
   */
  metaFile?: boolean

  /**
   * Keep these packages out of the bundle and load them via `@require`.
   * Keys are specifiers (`jquery`, `vue`). A string value is the CDN URL; the
   * global name is derived from the specifier. Pass `{ global, url }` for `$` / `Vue`.
   *
   * Install `@types/…` (or a types-only package) for `tsc`. Do not install the
   * runtime package — serve maps the specifier to the CDN global, build rewrites
   * the import. See `examples/external-cdn`.
   */
  external?: UserscriptExternal
}

export type UserscriptPluginConfig = UserscriptConfig | UserscriptConfig[]

export interface ResolvedScript {
  entry: string
  fileName: string
  header: HeaderConfig
  server: {
    open: ResolvedServerOpen
    prefix: string | false
    file: boolean
  }
  headerAlign: number | false
  generate?: (ctx: HeaderGenerateContext) => string
  autoMetaUrls: boolean
  metaFile: boolean
  external: ResolvedExternal[]
}

export interface ResolvedPluginConfig {
  scripts: ResolvedScript[]
}
