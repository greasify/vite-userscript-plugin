export const GM = [
  'setValue',
  'getValue',
  'deleteValue',
  'listValues',
  'setValues',
  'getValues',
  'deleteValues',
  'setClipboard',
  'addStyle',
  'addElement',
  'addValueChangeListener',
  'removeValueChangeListener',
  'registerMenuCommand',
  'unregisterMenuCommand',
  'download',
  'getTab',
  'getTabs',
  'saveTab',
  'openInTab',
  'notification',
  'getResourceURL',
  'getResourceText',
  'xmlhttpRequest',
  'webRequest',
  'cookie',
  'audio',
  'log',
  'info',
] as const

export const GMwindow = [
  'unsafeWindow',
  'window.onurlchange',
  'window.focus',
  'window.close',
] as const

// Official GM.* names use different camelCase than GM_* (`xmlHttpRequest` vs `xmlhttpRequest`).
export const GM_DOT_ALIASES = [
  'GM.xmlHttpRequest',
  'GM.getResourceUrl',
] as const

export type CatalogGrant
  = | `GM_${(typeof GM)[number]}`
    | `GM.${(typeof GM)[number]}`
    | (typeof GMwindow)[number]
    | (typeof GM_DOT_ALIASES)[number]

export const grants: CatalogGrant[] = [
  ...GM.flatMap(grant => [`GM_${grant}`, `GM.${grant}`] as const),
  ...GMwindow,
  ...GM_DOT_ALIASES,
]

export const gmIdentifiers = [
  'GM',
  'unsafeWindow',
  ...GM.map(grant => `GM_${grant}`),
] as const
