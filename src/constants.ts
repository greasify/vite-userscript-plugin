import type { Grants } from './types.js'

export const regexpScripts = new RegExp(/.(t|j)sx?/)
export const regexpStyles = new RegExp(/\.(s?css|sass)$/)

export const GM = [
  'setValue',
  'getValue',
  'deleteValue',
  'listValues',
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
  'log',
  'info'
] as const

export const GMwindow = [
  'unsafeWindow',
  'window.onurlchange',
  'window.focus',
  'window.close'
] as const

export const grants = GM.map<Grants[]>((grant) => [
  `GM_${grant}`,
  `GM.${grant}`
]).flat()

grants.push(...GMwindow)
