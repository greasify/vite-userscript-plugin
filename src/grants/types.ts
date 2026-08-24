import type { CatalogGrant, GM_DOT_ALIASES, GMwindow } from './catalog.js'

export type GMLiterals<T extends string> = [`GM_${T}` | `GM.${T}`]
export type GMWindow = (typeof GMwindow)[number]
export type GMDotAlias = (typeof GM_DOT_ALIASES)[number]
export type Grants = CatalogGrant
