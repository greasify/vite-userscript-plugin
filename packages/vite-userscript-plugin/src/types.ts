import { grants } from './constants.js'

export interface Transform {
  file: string
  name: string
  loader: 'js' | 'css'
}

export type RunAt =
  | 'document-start'
  | 'document-body'
  | 'document-end'
  | 'document-idle'
  | 'context-menu'

export type Grants = typeof grants[number]

export type MetadataConfig = {
  [property: string]: string | boolean | number | string[] | undefined

  /**
   * The name of the script.
   * Internationalization is done by adding an appendix naming the locale.
   */
  name: string

  /**
   * Version of the script,
   * it can be used to check if a script has new versions. It is composed
   * of several parts, joined by `.` Each part must start with numbers,
   * and can be followed by alphabetic characters.
   */
  version: string

  /**
   * A brief summary to describe the script.
   */
  description?: string

  /**
   * The scripts author.
   */
  author?: string

  /**
   * The script license.
   */
  license?: string

  /**
   * The combination of `@namespace` and `@name` is the unique identifier for
   * a userscript. `@namespace` can be any string, for example the homepage
   * of a group of userscripts by the same author. If not provided
   * the `@namespace` falls back to an empty string ('').
   */
  namespace?: string

  /**
   * The authors homepage that is used at the options page to link from
   * the scripts name to the given page. Please note that if the `@namespace`
   * tag starts with `https://` its content will be used for this too.
   */
  homepage?: string

  /**
   * An update URL for the userscript.
   * Note:
   * - a `@version` tag is required to make update checks work.
   */
  updateURL?: string

  /**
   * Defines the URL where the script will be downloaded from when an update was
   * detected. If the value none is used, then no update check will be done.
   */
  downloadURL?: string

  /**
   * Defines the URL where the user can report issues and get personal support.
   */
  supportURL?: string

  /**
   * Specify an icon for the script. Almost any image will work,
   * but a 32x32 pixel size is best. This value may be specified relative
   * to the URL the script itself is downloaded from.
   */
  icon?: string
  icon64?: string

  /**
   * Each `@include` and `@exclude` rule can be one of the following:
   * - a normal string
   *   > If the string does not start or end with a slash (/),
   *   > it will be used as a normal string.
   *   > If there are wildcards (*), each of them matches any characters.
   *   > e.g. https://www.google.com/* matches the following:
   *    - https://www.google.com/
   *    - https://www.google.com/any/subview
   *   > but not the following:
   *    - http://www.google.com/
   *    - https://www.google.com.hk/
   *   > If there is no wildcard in the string, the rule matches the entire URL.
   *   > e.g. https://www.google.com/ matches only https://www.google.com/
   *   > but not https://www.google.com/any/subview.
   *   > The host part accepts .tld to match top level domain suffix.
   *   > e.g. https://www.google.tld/ matches both https://www.google.com/
   *   > and https://www.google.co.jp/.
   *
   * - a regular expression
   *   > If the string starts and ends with a slash (/),
   *   > it will be compiled as a regular expression.
   *   > e.g. /\.google\.com[\.\/]/ matches the following:
   *    - https://www.google.com/,
   *    - https://www.google.com/any/subview
   *    - http://www.google.com/
   *    - https://www.google.com.hk/
   */
  include?: string[] | string
  exclude?: string[] | string

  /**
   * More or less equal to the `@include` tag.
   * You can get more information
   * [here](https://developer.chrome.com/docs/extensions/mv2/match_patterns/).
   *
   * Note:
   * - The `<all_urls>` statement is not yet supported and the scheme part also
   * accepts `http*://`.
   */
  match: string[] | string

  /**
   * Points to a JavaScript file that is loaded and executed before the script
   * itself starts running.
   *
   * Note:
   * - The scripts loaded via `@require` and their "use strict" statements
   * might influence the userscript's strict mode!
   */
  require?: string[] | string

  /**
   * Preloads resources that can by accessed
   * via `GM_getResourceURL` and `GM_getResourceText` by the script.
   */
  resource?: string[] | string

  /**
   * This tag defines the domains (no top-level domains) including subdomains
   * which are allowed to be retrieved by `GM_xmlhttpRequest`
   *
   * - domains like tampermonkey.net (this will also allow all sub-domains)
   * - sub-domains i.e. safari.tampermonkey.net
   * - self to whitelist the domain the script is currently running at
   * - localhost to access the localhost
   * - 1.2.3.4 to connect to an IP address
   *
   * If it's not possible to declare all domains a userscript might connect
   * to then it's a good practice to do the following: ***Declare all known or
   * at least all common domains*** that might be connected by the script.
   * This way the confirmation dialog can be avoided for most of the users.
   *
   * Additionally add `@connect *` to the script. By doing so Tampermonkey will
   * still ask the user whether the next connection to a not mentioned domain
   * is allowed, but also ***offer a "Always allow all domains" button***.
   * If the user clicks at this button then all future requestswill
   * be permitted automatically.
   */
  connect?: string[] | string

  /**
   * This tag makes the script running on the main pages, but not at iframes.
   * @default false
   */
  noframes?: boolean

  /**
   * `@grant` is used to whitelist GM_* functions, the `unsafeWindow` object and
   * some powerful window functions. If no `@grant` tag is given TM guesses
   * the scripts needs.
   */
  grant?: Exclude<Grants, 'GM_addStyle' | 'GM_info'>[]

  /**
   * Defines the moment the script is injected. In opposition to other script
   * handlers, `@run-at` defines the first possible moment a script wants to
   * run. This means it may happen, that a script that uses the `@require` tag
   * may be executed after the document is already loaded, cause fetching the
   * required script took that long. Anyhow, all `DOMNodeInserted` and
   * `DOMContentLoaded` events that happended after the given injection
   * moment are cached and delivered to the script when it is injected.
   *
   * - `document-start`
   * The script will be injected as fast as possible.
   *
   * - `document-body`
   * The script will be injected if the body element exists.
   *
   * - `document-end`
   * The script will be injected when or after the `DOMContentLoaded` event
   * was dispatched.
   *
   * - `document-idle`
   * The script will be injected after the DOMContentLoaded event was
   * dispatched. This is the default value if no `@run-at` tag is given.
   *
   * - `context-menu`
   * The script will be injected if it is clicked at the browser context menu
   * (desktop Chrome-based browsers only).
   *
   * Note:
   * - all `@include` and `@exclude` statements will be ignored if this value
   * is used, but this may change in the future.
   *
   * @default 'document-idle'
   */
  'run-at'?: RunAt
}

export interface ServerConfig {
  /**
   * @default 8000
   */
  port?: number
}

export interface PluginConfig {
  /**
   * Path of userscript entry.
   */
  entry: string

  /**
   * @default false
   */
  autoGrants?: boolean

  server?: ServerConfig

  /**
   * Userscript Metadata config.
   */
  metadata: MetadataConfig
}
