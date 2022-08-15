type RunAt =
  | 'none'
  | 'document-start'
  | 'document-body'
  | 'document-end'
  | 'document-idle'
  | 'context-menu'

type Grants =
  | 'GM_setValue'
  | 'GM_getValue'
  | 'GM_deleteValue'
  | 'GM_setClipboard'
  | 'GM_addStyle'
  | 'GM_addElement'
  | 'GM_listValues'
  | 'GM_addValueChangeListener'
  | 'GM_removeValueChangeListener'
  | 'GM_log'
  | 'GM_registerMenuCommand'
  | 'GM_unregisterMenuCommand'
  | 'GM_openInTab'
  | 'GM_xmlhttpRequest'
  | 'GM_download'
  | 'GM_getTab'
  | 'GM_saveTab'
  | 'GM_getTabs'
  | 'GM_notification'
  | 'GM_info'

export interface UserscriptPluginOptions {
  [property: string]: string | boolean | string[]
  name: string
  namespace: string
  version: string
  author: string
  description: string
  homepage: string
  icon: string
  include: string[] | string
  exclude: string[] | string
  match: string[] | string
  require: string[] | string
  connect: string
  'run-at': RunAt
  grant: Grants[]
}
