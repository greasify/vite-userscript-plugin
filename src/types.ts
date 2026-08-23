import type { GM, GM_DOT_ALIASES, GMwindow } from "./constants.js";

export type RunAt
  = | "document-start"
    | "document-body"
    | "document-end"
    | "document-idle"
    | "context-menu";

export type GMLiterals<T extends string> = [`GM_${T}` | `GM.${T}`];
export type GMWindow = (typeof GMwindow)[number];
export type GMDotAlias = (typeof GM_DOT_ALIASES)[number];
export type Grants = GMWindow | GMLiterals<(typeof GM)[number]>[number] | GMDotAlias;

export type HeaderConfig = {
  [property: string]: any;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:name
   */
  "name": string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:namespace
   */
  "namespace"?: string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:copyright
   */
  "copyright"?: string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:version
   */
  "version": string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:description
   */
  "description"?: string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:icon
   */
  "icon"?: string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:icon
   */
  "iconURL"?: string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:icon
   */
  "defaulticon"?: string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:icon64
   */
  "icon64"?: string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:icon64
   */
  "icon64URL"?: string;

  /**
   * `@grant none` disables GM APIs. Do not mix with auto-detected grants.
   *
   * @see https://www.tampermonkey.net/documentation.php#meta:grant
   */
  "grant"?: Grants[] | "none";

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:author
   */
  "author"?: string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:homepage
   */
  "homepage"?: string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:homepage
   */
  "homepageURL"?: string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:homepage
   */
  "website"?: string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:homepage
   */
  "source"?: string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:antifeature
   */
  "antifeature"?: [type: string, description: string][];

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:require
   */
  "require"?: string[] | string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:resource
   */
  "resource"?: [key: string, value: string][];

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:include
   */
  "include"?: string[] | string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:match
   * @see https://violentmonkey.github.io/api/metadata-block/#match--exclude-match
   */
  "match": string[] | string;

  /**
   * @see https://violentmonkey.github.io/api/metadata-block/#match--exclude-match
   */
  "exclude-match"?: string[] | string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:exclude
   */
  "exclude"?: string[] | string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:run_at
   */
  "run-at"?: RunAt;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:sandbox
   */
  "sandbox"?: string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:connect
   */
  "connect"?: string[] | string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:noframes
   */
  "noframes"?: boolean;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:updateURL
   */
  "updateURL"?: string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:downloadURL
   */
  "downloadURL"?: string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:supportURL
   */
  "supportURL"?: string;

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:webRequest
   */
  "webRequest"?: string[];

  /**
   * @see https://www.tampermonkey.net/documentation.php#meta:unwrap
   */
  "unwrap"?: boolean;
};

export interface ScriptOptions {
  /**
   * Path of userscript entry.
   */
  entry: string;

  /**
   * Output base name (`{fileName}.user.js`).
   *
   * @default sanitized `header.name`
   */
  fileName?: string;

  /**
   * Userscript header for this entry.
   */
  header: HeaderConfig;
}

export interface ServerConfig {
  /**
   * Open the `.dev.user.js` install URL when the Vite server starts.
   *
   * @default false
   */
  open?: boolean;

  /**
   * Prefix applied to `@name` in serve mode.
   * Set `false` to disable.
   *
   * @default 'server:'
   */
  prefix?: string | false;
}

export type BannerMode = "serve" | "build" | "meta";

export interface BannerGenerateContext {
  userscript: string;
  mode: BannerMode;
}

export type CssInject
  = | "auto"
    | string
    | ((css: string) => void);

type UserscriptSharedConfig = {
  /**
   * Serve-mode options.
   */
  server?: ServerConfig;

  /**
   * How to inject collected CSS in production builds.
   *
   * @default 'auto'
   */
  cssInject?: CssInject;

  /**
   * Extra spaces after the longest `@key`, or `false` for a single space.
   *
   * @default 1
   */
  align?: number | false;

  /**
   * Rewrite the generated metablock.
   */
  generate?: (ctx: BannerGenerateContext) => string;

  /**
   * Derive `updateURL` / `downloadURL` from `homepage`, `homepageURL`,
   * `website`, or `source` when those fields are empty. Warns if no homepage
   * alias is set, or if `metaFile` is `false` (`@updateURL` would point at a
   * missing file).
   *
   * @default false
   */
  autoMetaUrls?: boolean;

  /**
   * Emit `{fileName}.meta.js` alongside the userscript.
   * Keep enabled when using `autoMetaUrls`, otherwise `@updateURL` 404s.
   *
   * @default true
   */
  metaFile?: boolean;
};

/**
 * Single-script sugar. Mutually exclusive with {@link UserscriptScriptsConfig}.
 */
export type UserscriptEntryConfig = UserscriptSharedConfig & {
  /**
   * Path of the userscript entry.
   */
  entry: string;

  /**
   * Output base name (`{fileName}.user.js`).
   *
   * @default sanitized `header.name`
   */
  fileName?: string;

  /**
   * Userscript header (`name`, `version`, `match` required).
   */
  header: HeaderConfig;

  scripts?: never;
};

/**
 * Multiple userscripts from one Vite config. Mutually exclusive with {@link UserscriptEntryConfig}.
 */
export type UserscriptScriptsConfig = UserscriptSharedConfig & {
  /**
   * Userscripts to serve and build. At least one entry is required.
   */
  scripts: [ScriptOptions, ...ScriptOptions[]];

  /**
   * Default header fields merged into every script.
   */
  header?: Partial<HeaderConfig>;

  entry?: never;
  fileName?: never;
};

export type UserscriptPluginConfig = UserscriptEntryConfig | UserscriptScriptsConfig;

export interface ResolvedScript {
  entry: string;
  fileName: string;
  iifeName: string;
  header: HeaderConfig;
}

export interface ResolvedPluginConfig {
  scripts: ResolvedScript[];
  server: {
    open: boolean;
    prefix: string | false;
  };
  cssInject: CssInject;
  align: number | false;
  generate?: (ctx: BannerGenerateContext) => string;
  autoMetaUrls: boolean;
  metaFile: boolean;
}
