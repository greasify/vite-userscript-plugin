declare const unsafeWindow: Window

declare type VMScriptRunAt =
  | 'document-start'
  | 'document-body'
  | 'document-end'
  | 'document-idle'

/** Injection mode of a script. */
declare type VMScriptInjectInto = 'auto' | 'page' | 'content'

declare interface VMScriptGMInfoPlatform {
  arch: 'arm' | 'arm64' | 'x86-32' | 'x86-64' | 'mips' | 'mips64'
  /** `chrome`, `firefox` or whatever was returned by the API. */
  browserName: string
  browserVersion: string
  os: 'mac' | 'win' | 'android' | 'cros' | 'linux' | 'openbsd' | 'fuchsia'
}

declare interface VMScriptGMInfoScriptMeta {
  description: string
  excludes: string[]
  includes: string[]
  matches: string[]
  name: string
  namespace: string
  resources: Array<{ name: string; url: string }>
  runAt: VMScriptRunAt
  version: string
}

declare interface VMScriptGMInfoObject {
  /** Unique ID of the script. */
  uuid: string
  /** The meta block of the script. */
  scriptMetaStr: string
  /** Whether the script will be updated automatically. */
  scriptWillUpdate: boolean
  /** The name of userscript manager, which should be the string `Violentmonkey`. */
  scriptHandler: string
  /** Version of Violentmonkey. */
  version: string
  /**
   * Unlike `navigator.userAgent`, which can be overriden by other extensions/userscripts
   * or by devtools in device-emulation mode, `GM_info.platform` is more reliable as the
   * data is obtained in the background page of Violentmonkey using a specialized
   * extension API (`browser.runtime.getPlatformInfo` and `getBrowserInfo`).
   */
  platform: VMScriptGMInfoPlatform
  /** Contains structured fields from the *Metadata Block*. */
  script: VMScriptGMInfoScriptMeta
  /** The injection mode of current script. */
  injectInto: VMScriptInjectInto
}

/**
 * An object that exposes information about the current userscript.
 */
declare const GM_info: VMScriptGMInfoObject

/** Retrieves a value for current script from storage. */
declare function GM_getValue<T>(name: string, defaultValue?: T): T
/** Sets a key / value pair for current script to storage. */
declare function GM_setValue<T>(name: string, value: T): void
/** Deletes an existing key / value pair for current script from storage. */
declare function GM_deleteValue(name: string): void
/** Returns an array of keys of all available values within this script. */
declare function GM_listValues(): string[]

declare type VMScriptGMValueChangeCallback<T> = (
  /** The name of the observed variable */
  name: string,
  /** The old value of the observed variable (`undefined` if it was created) */
  oldValue: T,
  /** The new value of the observed variable (`undefined` if it was deleted) */
  newValue: T,
  /** `true` if modified by the userscript instance of another tab or `false` for this script instance. Can be used by scripts of different browser tabs to communicate with each other. */
  remote: boolean
) => void

/** Adds a change listener to the storage and returns the listener ID. */
declare function GM_addValueChangeListener<T>(
  name: string,
  callback: VMScriptGMValueChangeCallback<T>
): string
/** Removes a change listener by its ID. */
declare function GM_removeValueChangeListener(listenerId: string): void

/** Retrieves a text resource from the *Metadata Block*. */
declare function GM_getResourceText(
  /** Name of a resource defined in the *Metadata Block*. */
  name: string
): string
/**
 * Retrieves a `blob:` or `data:` URL of a resource from the *Metadata Block*.
 *
 * Note: when setting this URL as `src` or `href` of a DOM element, it may fail on some sites with a particularly strict CSP that forbids `blob:` or `data:` URLs. Such sites are rare though. The workaround in Chrome is to use `GM_addElement`, whereas in Firefox you'll have to disable CSP either globally via `about:config` or by using an additional extension that modifies HTTP headers selectively.
 */
declare function GM_getResourceURL(
  /** Name of a resource defined in the *Metadata Block*. */
  name: string,
  /**
   * - If `true`, returns a `blob:` URL. It's short and cacheable, so it's good for reusing in multiple DOM elements.
   * - If `false`, returns a `data:` URL. It's long so reusing it in DOM may be less performant due to the lack of caching, but it's particularly handy for direct synchronous decoding of the data on sites that forbid fetching `blob:` in their CSP.
   */
  isBlobUrl?: boolean
): string

/**
 * Appends and returns an element with the specified attributes.
 *
 * Examples:
 *
 * ```js
 * // using a private function in `onload`
 * let el = GM_addElement('script', { src: 'https://....' });
 * el.onload = () => console.log('loaded', el);
 *
 * // same as GM_addStyle('a { color:red }')
 * let el = GM_addElement('style', { textContent: 'a { color:red }' });
 *
 * // appending to an arbitrary node
 * let el = GM_addElement(parentElement.shadowRoot, 'iframe', { src: url });
 * ```
 */
declare function GM_addElement(
  /** A tag name like `script`. Any valid HTML tag can be used, but the only motivation for this API was to add `script`, `link`, `style` elements when they are disallowed by a strict `Content-Security-Policy` of the site e.g. github.com, twitter.com. */
  tagName: string,
  /** The keys are HTML attributes, not DOM properties, except `textContent` which sets DOM property `textContent`. The values are strings so if you want to assign a private function to `onload` you can do it after the element is created. */
  attributes?: Record<string, string>
): HTMLElement
declare function GM_addElement(
  /**
   * The parent node to which the new node will be appended.
   * It can be inside ShadowDOM: `someElement.shadowRoot`.
   * When omitted, it'll be determined automatically:
   *
   * - `document.head` (`<head>`) for `script`, `link`, `style`, `meta` tags.
   * - `document.body` (`<body>`) for other tags or when there's no `<head>`.
   * - `document.documentElement` (`<html>` or an XML root node) otherwise.
   */
  parentNode: HTMLElement,
  /** A tag name like `script`. Any valid HTML tag can be used, but the only motivation for this API was to add `script`, `link`, `style` elements when they are disallowed by a strict `Content-Security-Policy` of the site e.g. github.com, twitter.com. */
  tagName: string,
  /** The keys are HTML attributes, not DOM properties, except `textContent` which sets DOM property `textContent`. The values are strings so if you want to assign a private function to `onload` you can do it after the element is created. */
  attributes?: Record<string, string>
): HTMLElement

/** Appends and returns a `<style>` element with the specified CSS. */
declare function GM_addStyle(css: string): HTMLStyleElement

declare interface VMScriptGMTabControl {
  /** Сan be assigned to a function. If provided, it will be called when the opened tab is closed. */
  onclose?: () => void
  /** Whether the opened tab is closed. */
  closed: boolean
  /** A function to explicitly close the opened tab. */
  close: () => void
}

declare interface VMScriptGMTabOptions {
  /** Make the new tab active (i.e. open in foreground). Default as `true`. */
  active?: boolean
  /**
   * Firefox only.
   *
   * - not specified = reuse script's tab container
   * - `0` = default (main) container
   * - `1`, `2`, etc. = internal container index
   */
  container?: number
  /** Insert the new tab next to the current tab and set its `openerTab` so when it's closed the original tab will be focused automatically. When `false` or not specified, the usual browser behavior is to open the tab at the end of the tab list. Default as `true`. */
  insert?: boolean
  /** Pin the tab (i.e. show without a title at the beginning of the tab list). Default as `false`. */
  pinned?: boolean
}

/** Opens URL in a new tab. */
declare function GM_openInTab(
  /** The URL to open in a new tab. URL relative to current page is also allowed. Note: Firefox does not support data URLs. */
  url: string,
  options?: VMScriptGMTabOptions
): VMScriptGMTabControl
declare function GM_openInTab(
  /** The URL to open in a new tab. URL relative to current page is also allowed. Note: Firefox does not support data URLs. */
  url: string,
  /** Open the tab in background. Note, this is a reverse of the first usage method so for example `true` is the same as `{ active: false }`. */
  openInBackground?: boolean
): VMScriptGMTabControl

/**
 * Registers a command in Violentmonkey popup menu.
 * If you want to add a shortcut, please see `@violentmonkey/shortcut`.
 */
declare function GM_registerMenuCommand(
  /** The name to show in the popup menu. */
  caption: string,
  /** Callback function when the command is clicked in the menu. */
  onClick: (event: MouseEvent) => void
): string
/** Unregisters a command which has been registered to Violentmonkey popup menu. */
declare function GM_unregisterMenuCommand(
  /** The name of command to unregister. */
  caption: string
): void

/**
 * A control object returned by `GM_notification`.
 * `control.remove()` can be used to remove the notification.
 */
declare interface VMScriptGMNotificationControl {
  /** Remove the notification immediately. */
  remove: () => Promise<void>
}

declare interface VMScriptGMNotificationOptions {
  /** Main text of the notification. */
  text: string
  /** Title of the notification. */
  title?: string
  /** URL of an image to show in the notification. */
  image?: string
  /** Callback when the notification is clicked by user. */
  onclick?: () => void
  /** Callback when the notification is closed, either by user or by system. */
  ondone?: () => void
}

/** Shows an HTML5 desktop notification. */
declare function GM_notification(
  options: VMScriptGMNotificationOptions
): VMScriptGMNotificationControl
declare function GM_notification(
  /** Main text of the notification. */
  text: string,
  /** Title of the notification. */
  title?: string,
  /** URL of an image to show in the notification. */
  image?: string,
  /** Callback when the notification is clicked by user. */
  onclick?: () => void
): VMScriptGMNotificationControl

/** Sets data to system clipboard. */
declare function GM_setClipboard(
  /** The data to be copied to system clipboard. */
  data: string,
  /** The MIME type of data to copy. Default as `text/plain`. */
  type?: string
): void

/**
 * A control object returned by `GM_xmlhttpRequest`.
 * `control.abort()` can be used to abort the request.
 */
declare interface VMScriptXHRControl {
  abort: () => void
}

declare type VMScriptResponseType =
  | 'text'
  | 'json'
  | 'blob'
  | 'arraybuffer'
  | 'document'

declare interface VMScriptResponseObject<T> {
  status: number
  statusText: string
  readyState: number
  responseHeaders: string
  response: T
  responseText: string | null
  /** The final URL after redirection. */
  finalUrl: string
  /** The same `context` object you specified in `details`. */
  context?: unknown
}

declare interface VMScriptGMXHRDetails<T> {
  /** URL relative to current page is also allowed. */
  url: string
  /** HTTP method, default as `GET`. */
  method?: string
  /** User for authentication. */
  user?: string
  /** Password for authentication. */
  password?: string
  /** A MIME type to specify with the request. */
  overrideMimeType?: string
  /**
   * Some special headers are also allowed:
   *
   * - `Cookie`
   * - `Host`
   * - `Origin`
   * - `Referer`
   * - `User-Agent`
   */
  headers?: Record<string, string>
  /**
   * One of the following:
   *
   * - `text` (default value)
   * - `json`
   * - `blob`
   * - `arraybuffer`
   * - `document`
   */
  responseType?: VMScriptResponseType
  /** Time to wait for the request, none by default. */
  timeout?: number
  /** Data to send with the request, usually for `POST` and `PUT` requests. */
  data?: string | FormData | Blob
  /** Send the `data` string as a `blob`. This is for compatibility with Tampermonkey/Greasemonkey, where only `string` type is allowed in `data`. */
  binary?: boolean
  /** Can be an object and will be assigned to context of the response object. */
  context?: unknown
  /** When set to `true`, no cookie will be sent with the request and the response cookies will be ignored. The default value is `false`. */
  anonymous?: boolean
  onabort?: (resp: VMScriptResponseObject<T>) => void
  onerror?: (resp: VMScriptResponseObject<T>) => void
  onload?: (resp: VMScriptResponseObject<T>) => void
  onloadend?: (resp: VMScriptResponseObject<T>) => void
  onloadstart?: (resp: VMScriptResponseObject<T>) => void
  onprogress?: (resp: VMScriptResponseObject<T>) => void
  onreadystatechange?: (resp: VMScriptResponseObject<T>) => void
  ontimeout?: (resp: VMScriptResponseObject<T>) => void
}

/** Makes a request like XMLHttpRequest, with some special capabilities, not restricted by same-origin policy. */
declare function GM_xmlhttpRequest<T>(
  details: VMScriptGMXHRDetails<T>
): VMScriptXHRControl

declare interface VMScriptGMDownloadOptions {
  /** The URL to download. */
  url: string
  /** The filename to save as. */
  name?: string
  /** The function to call when download starts successfully. */
  onload?: () => void
  headers?: Record<string, string>
  timeout?: number
  onerror?: (resp: VMScriptResponseObject<Blob>) => void
  onprogress?: (resp: VMScriptResponseObject<Blob>) => void
  ontimeout?: (resp: VMScriptResponseObject<Blob>) => void
}

/** Downloads a URL to a local file. */
declare function GM_download(options: VMScriptGMDownloadOptions): void
declare function GM_download(
  /** The URL to download. */
  url: string,
  /** The filename to save as. */
  name?: string
): void

declare interface VMScriptGMObject {
  unsafeWindow: Window
  info: typeof GM_info
  getValue: <T>(name: string, defaultValue?: T) => Promise<T>
  setValue: <T>(name: string, value: T) => Promise<void>
  deleteValue: (name: string) => Promise<void>
  listValues: () => Promise<string[]>
  addStyle: typeof GM_addStyle
  addElement: typeof GM_addElement
  registerMenuCommand: typeof GM_registerMenuCommand
  getResourceUrl: (name: string, isBlobUrl?: boolean) => Promise<string>
  notification: typeof GM_notification
  openInTab: typeof GM_openInTab
  setClipboard: typeof GM_setClipboard
  xmlHttpRequest: typeof GM_xmlhttpRequest
}

declare const GM: VMScriptGMObject
