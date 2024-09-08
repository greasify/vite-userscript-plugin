declare const unsafeWindow: Window

declare type VMScriptRunAt =
  | 'document-start'
  | 'document-body'
  | 'document-end'
  | 'document-idle'

/** Injection mode of a script. */
declare type VMScriptInjectInto = 'auto' | 'page' | 'content'

declare type GenericObject = Record<string, unknown>

declare interface VMScriptGMInfoPlatform {
  arch:
    | 'aarch64'
    | 'arm'
    | 'arm64'
    | 'mips'
    | 'mips64'
    | 'ppc64'
    | 's390x'
    | 'sparc64'
    | 'x86-32'
    | 'x86-64'
  browserName: 'chrome' | 'firefox' | string
  browserVersion: string
  os: 'mac' | 'win' | 'android' | 'cros' | 'linux' | 'openbsd' | 'fuchsia'
}

/**
 * GM_info.script and GM.info.script
 * Non-optional string property will be an empty string '' if omitted.
 */
declare interface VMScriptGMInfoScriptMeta {
  antifeature?: string[]
  author?: string
  compatible?: string[]
  connect?: string[]
  description: string
  downloadURL?: string
  excludeMatches: string[]
  excludes: string[]
  /** Empty is the same as `@grant none` */
  grant: string[]
  /** Use homepageURL instead */
  homepage?: string
  homepageURL?: string
  icon?: string
  includes: string[]
  matches: string[]
  name: string
  namespace: string
  noframes?: boolean
  require: string[]
  resources: { name: string; url: string }[]
  runAt: VMScriptRunAt | ''
  supportURL?: string
  unwrap?: boolean
  updateURL?: string
  version: string
}

declare interface VMScriptGMInfoObject {
  /** Unique ID of the script. */
  uuid: string
  /** The injection mode of current script. */
  injectInto: VMScriptInjectInto
  /** Contains structured fields from the *Metadata Block*. */
  script: VMScriptGMInfoScriptMeta
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
  /**
   * A copy of navigator.userAgentData from the content script of the extension.
   * @since VM2.20.2 */
  userAgentData?: {
    brands: { brand: string; version: string }[]
    mobile: boolean
    platform: string
  }
}

/**
 * An object that exposes information about the current userscript.
 */
declare const GM_info: VMScriptGMInfoObject

/** The original console.log */
declare function GM_log(...args: any): void

/** Retrieves a value for current script from storage. */
declare function GM_getValue<T>(name: string, defaultValue?: T): T
/** @since VM2.19.1 */
declare function GM_getValues(names: string[]): GenericObject
/** @since VM2.19.1 */
declare function GM_getValues(namesWithDefaults: GenericObject): GenericObject
/** Sets a key / value pair for current script to storage. */
declare function GM_setValue<T>(name: string, value: T): void
/** @since VM2.19.1 */
declare function GM_setValues(values: GenericObject): void
/** Deletes an existing key / value pair for current script from storage. */
declare function GM_deleteValue(name: string): void
/** @since VM2.19.1 */
declare function GM_deleteValues(names: string[]): void
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
 * Returns the command's id since VM2.12.5, see description of the `id` parameter.
 * If you want to add a shortcut, please see `@violentmonkey/shortcut`.
 */
declare function GM_registerMenuCommand(
  /** The name to show in the popup menu. */
  caption: string,
  /** Callback function when the command is clicked in the menu. */
  onClick: (event: MouseEvent | KeyboardEvent) => void,
  /** @since VM2.15.9 */
  options?: {
    /** Default: the `caption` parameter.
     * In 2.15.9-2.16.1 the default was a randomly generated string. */
    id?: string
    /** A hint shown in the status bar when hovering the command. */
    title?: string
    /** Default: `true`.
     * Whether to auto-close the popup after the user invoked the command. */
    autoClose?: boolean
  }
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
  /** No sounds/vibrations when showing the notification.
   * @since VM2.15.2, Chrome 70. */
  silent?: boolean
  /**
   * Unique name of the notification, e.g. 'abc', same as the web Notification API.
   * Names are scoped to each userscript i.e. your tag won't clash with another script's tag.
   * The purpose of a tagged notification is to replace an older notification with the same tag,
   * even if it was shown in another tab (or before this tab was navigated elsewhere
   * and your notification had `zombieTimeout`).
   * @since VM2.15.4
   */
  tag?: string
  /**
   * Number of milliseconds to keep the notification after the userscript "dies",
   * i.e. when its tab or frame is reloaded/closed/navigated. If not specified or invalid,
   * the default behavior is to immediately remove the notifications.
   * @since VM2.15.4
   */
  zombieTimeout?: number
  /**
   * URL to open when a zombie notification is clicked, see `zombieTimeout` for more info.
   * @since VM2.16.1
   */
  zombieUrl?: string
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

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#properties
 * https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent#properties
 */
declare interface VMScriptResponseObject<T> {
  status: number
  statusText: string
  readyState: number
  responseHeaders: string
  response: T | null
  responseText: string | undefined
  responseXML: Document | null
  /** The final URL after redirection. */
  finalUrl: string
  lengthComputable?: boolean
  loaded?: number
  total?: number
  /** The same `context` object you specified in `details`. */
  context?: unknown
}

type TypedArray =
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Int16Array
  | Int32Array
  | BigUint64Array
  | BigInt64Array
  | Float32Array
  | Float64Array

interface GMRequestBase<T> {
  /** URL relative to current page is also allowed. */
  url: string
  /** User for authentication. */
  user?: string
  /** Password for authentication. */
  password?: string
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
  /** Time to wait for the request, none by default. */
  timeout?: number
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

declare interface VMScriptGMXHRDetails<T> extends GMRequestBase<T> {
  /** HTTP method, default as `GET`. */
  method?: string
  /** A MIME type to specify with the request. */
  overrideMimeType?: string
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
  /** Data to send with the request, usually for `POST` and `PUT` requests. */
  data?:
    | string
    | ArrayBuffer
    | Blob
    | DataView
    | FormData
    | ReadableStream
    | TypedArray
    | URLSearchParams
  /** Send the `data` string as a `blob`. This is for compatibility with Tampermonkey/Greasemonkey, where only `string` type is allowed in `data`. */
  binary?: boolean
}

/** Makes a request like XMLHttpRequest, with some special capabilities, not restricted by same-origin policy. */
declare function GM_xmlhttpRequest<
  T = string | Blob | ArrayBuffer | Document | object
>(details: VMScriptGMXHRDetails<T>): VMScriptXHRControl

declare interface VMScriptGMDownloadOptions extends GMRequestBase<Blob> {
  /** The filename to save as. */
  name: string
}

/** Downloads a URL to a local file. */
declare function GM_download(options: VMScriptGMDownloadOptions): void
declare function GM_download(
  /** The URL to download. */
  url: string,
  /** The filename to save as. */
  name: string
): void

/** Aliases for GM_ methods that are not included in Greasemonkey4 API */
declare interface VMScriptGMObjectVMExtensions {
  addElement: typeof GM_addElement
  addStyle: typeof GM_addStyle
  addValueChangeListener: typeof GM_addValueChangeListener
  /** @since VM2.19.1 */
  deleteValues: (names: string[]) => Promise<void>
  download:
    | ((options: VMScriptGMDownloadOptions) => Promise<Blob> | void)
    | ((url: string, name: string) => Promise<Blob> | void)
  getResourceText: typeof GM_getResourceText
  /** @since VM2.19.1 */
  getValues:
    | ((names: string[]) => Promise<GenericObject>)
    | ((namesWithDefaults: GenericObject) => Promise<GenericObject>)
  log: typeof GM_log
  removeValueChangeListener: typeof GM_removeValueChangeListener
  /** @since VM2.19.1 */
  setValues: (values: GenericObject) => Promise<void>
  unregisterMenuCommand: typeof GM_unregisterMenuCommand
}

/** The Greasemonkey4 API, https://wiki.greasespot.net/Greasemonkey_Manual:API */
declare interface VMScriptGMObject extends VMScriptGMObjectVMExtensions {
  unsafeWindow: Window
  info: typeof GM_info
  getValue: <T>(name: string, defaultValue?: T) => Promise<T>
  setValue: <T>(name: string, value: T) => Promise<void>
  deleteValue: (name: string) => Promise<void>
  listValues: () => Promise<string[]>
  registerMenuCommand: typeof GM_registerMenuCommand
  getResourceUrl: (name: string, isBlobUrl?: boolean) => Promise<string>
  notification: typeof GM_notification
  openInTab: typeof GM_openInTab
  setClipboard: typeof GM_setClipboard
  xmlHttpRequest: <T = string | Blob | ArrayBuffer | Document | object>(
    details: VMScriptGMXHRDetails<T>
  ) => Promise<T> & VMScriptXHRControl
}

declare const GM: VMScriptGMObject
