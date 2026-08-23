import type { Grants } from "./types.js";

export const pluginName = "vite-userscript-plugin";
export const FAQ_URL = "https://github.com/crashmax-dev/vite-userscript-plugin#faq";
export const GM_NAMESPACE = "__viteUserscriptGM__";
export const VITE_CLIENT_FLAG = "__viteUserscriptViteClient__";
export const REACT_PREAMBLE_PATH = `/${pluginName}/react-preamble.js`;
export const REACT_BOOTSTRAP_PATH = `/${pluginName}/react-bootstrap.js`;
export const REACT_REFRESH_PLUGIN_NAMES = new Set([
  "vite:react-refresh",
  "vite:react-virtual-preamble",
]);

export const GM = [
  "setValue",
  "getValue",
  "deleteValue",
  "listValues",
  "setValues",
  "getValues",
  "deleteValues",
  "setClipboard",
  "addStyle",
  "addElement",
  "addValueChangeListener",
  "removeValueChangeListener",
  "registerMenuCommand",
  "unregisterMenuCommand",
  "download",
  "getTab",
  "getTabs",
  "saveTab",
  "openInTab",
  "notification",
  "getResourceURL",
  "getResourceText",
  "xmlhttpRequest",
  "webRequest",
  "cookie",
  "audio",
  "log",
  "info",
] as const;

export const GMwindow = [
  "unsafeWindow",
  "window.onurlchange",
  "window.focus",
  "window.close",
] as const;

export const GM_DOT_ALIASES = [
  "GM.xmlHttpRequest",
  "GM.getResourceUrl",
] as const;

export const grants = GM.map<Grants[]>(grant => [
  `GM_${grant}`,
  `GM.${grant}`,
]).flat();

grants.push(...GMwindow);
grants.push(...GM_DOT_ALIASES);

export const gmIdentifiers = [
  "GM",
  "unsafeWindow",
  ...GM.map(grant => `GM_${grant}`),
] as const;
