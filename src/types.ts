import { GM, GMwindow } from './constants.js'

export interface Transform {
  minify: boolean
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

export type GMLiterals<T extends string> = [`GM_${T}` | `GM.${T}`]
export type GMWindow = typeof GMwindow[number]
export type Grants = GMWindow | GMLiterals<typeof GM[number]>[number]

export type HeaderConfig = {
  [property: string]: any

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:name
   */
  name: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:namespace
   */
  namespace?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:copyright
   */
  copyright?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:version
   */
  version: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:description
   */
  description?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:icon
   */
  icon?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:icon
   */
  iconURL?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:icon
   */
  defaulticon?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:icon64
   */
  icon64?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:icon64
   */
  icon64URL?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:grant
   */
  grant?: Grants[]

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:author
   */
  author?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:homepage
   */
  homepage?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:homepage
   */
  homepageURL?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:homepage
   */
  website?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:homepage
   */
  source?: string

  /**
   * @see https://www.tampermonkey.net/documentation.phpmeta:antifeature
   */
  antifeature?: [type: string, description: string][]

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:require
   */
  require?: string[] | string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:resource
   */
  resource?: [key: string, value: string][]

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:include
   */
  include?: string[] | string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:match
   * @see https://violentmonkey.github.io/api/metadata-block/#match--exclude-match
   */
  match: string[] | string

  /**
   * @see https://violentmonkey.github.io/api/metadata-block/#match--exclude-match
   */
  'exclude-match'?: string[] | string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:exclude
   */
  exclude?: string[] | string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:run_at
   */
  'run-at'?: RunAt

  /**
   * @see https://www.tampermonkey.net/documentation.phpmeta:sandbox
   */
  sandbox?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:connect
   */
  connect?: string[] | string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:noframes
   */
  noframes?: boolean

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:updateURL
   */
  updateURL?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:downloadURL
   */
  downloadURL?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:supportURL
   */
  supportURL?: string

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:webRequest
   */
  webRequest?: string[]

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:unwrap
   */
  unwrap?: boolean
}

export interface ServerConfig {
  /**
   * {@link https://github.com/sindresorhus/get-port}
   */
  port?: number

  /**
   * @default false
   */
  open?: boolean
}

export interface UserscriptPluginConfig {
  /**
   * Path of userscript entry.
   */
  entry: string

  /**
   * Userscript file name.
   */
  fileName?: string

  /**
   * Userscript header config.
   *
   * @see https://www.tampermonkey.net/documentation.php
   */
  header: HeaderConfig

  /**
   * Server config.
   */
  server?: ServerConfig
}
