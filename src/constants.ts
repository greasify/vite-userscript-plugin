export const regexpScripts = new RegExp(/.(t|j)sx?/)
export const regexpStyles = new RegExp(/\.(s?css|sass)$/)

export const grants = [
  'unsafeWindow',
  'window.onurlchange',
  'window.focus',
  'window.close',
  'GM_setValue',
  'GM_getValue',
  'GM_deleteValue',
  'GM_listValues',
  'GM_setClipboard',
  'GM_addStyle',
  'GM_addElement',
  'GM_addValueChangeListener',
  'GM_removeValueChangeListener',
  'GM_registerMenuCommand',
  'GM_unregisterMenuCommand',
  'GM_download',
  'GM_getTab',
  'GM_getTabs',
  'GM_saveTab',
  'GM_openInTab',
  'GM_notification',
  'GM_getResourceURL',
  'GM_getResourceText',
  'GM_xmlhttpRequest',
  'GM_webRequest',
  'GM_log',
  'GM_info'
] as const
